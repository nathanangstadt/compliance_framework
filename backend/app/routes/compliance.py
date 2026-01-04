from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from copy import deepcopy

from app.database import get_db
from app.models import Policy, ComplianceEvaluation, AgentVariant, ToolTransition, SessionStatus
from app.schemas import (
    EvaluateMemoryRequest,
    ComplianceEvaluationResponse,
    ComplianceSummary,
    ProcessBatchRequest,
    ProcessBatchResponse
)
from app.services.policy_evaluator import PolicyEvaluator
from app.services.memory_loader import memory_loader
from app.routes.agent_variants import _compute_and_store_variants

router = APIRouter(prefix="/api/compliance", tags=["compliance"])


def _latest_evaluations_by_policy(evaluations):
    """Return latest evaluation per policy_id keyed by policy_id."""
    latest = {}
    for ev in evaluations:
        existing = latest.get(ev.policy_id)
        if not existing or (ev.evaluated_at and existing.evaluated_at and ev.evaluated_at > existing.evaluated_at):
            latest[ev.policy_id] = ev
        elif not existing:
            latest[ev.policy_id] = ev
    return latest


def _collect_llm_usage(data):
    """Recursively collect llm_usage dicts from violations/compliance details."""
    usages = []

    def walk(node):
        if isinstance(node, dict):
            if 'llm_usage' in node and isinstance(node['llm_usage'], dict):
                usages.append(node['llm_usage'])
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(deepcopy(data))
    return usages


@router.post("/{agent_id}/evaluate", response_model=List[ComplianceEvaluationResponse])
async def evaluate_memory(agent_id: str, request: EvaluateMemoryRequest, db: Session = Depends(get_db)):
    """Evaluate an agent memory against policies."""
    memory = memory_loader.get_memory(agent_id=agent_id, memory_id=request.memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    # Get policies to evaluate against (filtered by agent)
    if request.policy_ids:
        policies = db.query(Policy).filter(
            Policy.id.in_(request.policy_ids),
            Policy.agent_id == agent_id
        ).all()
    else:
        policies = db.query(Policy).filter(
            Policy.enabled == True,
            Policy.agent_id == agent_id
        ).all()

    evaluator = PolicyEvaluator()
    results = []

    for policy in policies:
        # Delete existing evaluation for this memory-policy pair
        db.query(ComplianceEvaluation).filter(
            ComplianceEvaluation.memory_id == request.memory_id,
            ComplianceEvaluation.policy_id == policy.id,
            ComplianceEvaluation.agent_id == agent_id
        ).delete()
        db.commit()  # Commit the deletion before creating new evaluation

        # Evaluate - add policy metadata to config
        config_with_metadata = {
            **policy.config,
            'name': policy.name,
            'description': policy.description
        }
        is_compliant, details = evaluator.evaluate(
            memory["messages"],
            policy.policy_type,
            config_with_metadata
        )

        # Save evaluation
        # Store details in violations column (holds violations when non-compliant, compliance details when compliant)
        evaluation = ComplianceEvaluation(
            agent_id=agent_id,
            memory_id=request.memory_id,
            policy_id=policy.id,
            is_compliant=is_compliant,
            violations=details
        )
        db.add(evaluation)
        results.append(evaluation)

    db.commit()

    # Refresh to get IDs and transform to response format
    response_results = []
    for evaluation in results:
        db.refresh(evaluation)

        eval_dict = {
            "id": evaluation.id,
            "memory_id": evaluation.memory_id,
            "policy_id": evaluation.policy_id,
            "policy_name": evaluation.policy.name if evaluation.policy else None,
            "policy_description": evaluation.policy.description if evaluation.policy else None,
            "policy_severity": evaluation.policy.severity if evaluation.policy else 'error',
            "is_compliant": evaluation.is_compliant,
            "violations": evaluation.violations if not evaluation.is_compliant else [],
            "compliance_details": evaluation.violations if evaluation.is_compliant else None,
            "evaluated_at": evaluation.evaluated_at
        }
        response_results.append(eval_dict)

    return response_results


@router.get("/{agent_id}/summary", response_model=ComplianceSummary)
async def get_compliance_summary(agent_id: str, db: Session = Depends(get_db)):
    """Get overall compliance summary for a specific agent."""
    memories = memory_loader.list_memories(agent_id=agent_id)
    total_memories = len(memories)
    total_policies = db.query(Policy).filter(
        Policy.enabled == True,
        Policy.agent_id == agent_id
    ).count()

    policies = db.query(Policy).filter(
        Policy.enabled == True,
        Policy.agent_id == agent_id
    ).all()
    enabled_policy_ids = {p.id for p in policies}

    # Get list of current memory IDs
    current_memory_ids = {m["id"] for m in memories}

    # Determine which memories are fully processed (evaluated against all enabled policies)
    processed_memory_ids = set()
    for memory in memories:
        memory_id = memory["id"]
        evals = db.query(ComplianceEvaluation).filter(
            ComplianceEvaluation.memory_id == memory_id,
            ComplianceEvaluation.agent_id == agent_id
        ).all()
        latest_by_policy = _latest_evaluations_by_policy(evals)
        evaluated_policy_ids = set(latest_by_policy.keys())
        stale = False
        for policy in policies:
            ev = latest_by_policy.get(policy.id)
            if ev and policy.updated_at and ev.evaluated_at and policy.updated_at > ev.evaluated_at:
                stale = True
                break
        if enabled_policy_ids and enabled_policy_ids.issubset(evaluated_policy_ids) and not stale:
            processed_memory_ids.add(memory_id)

    compliance_by_policy = {}
    for policy in policies:
        # Get latest evaluation for each unique memory-policy combination
        # Group by memory_id and get the most recent (max id) for each
        from sqlalchemy import func

        subquery = db.query(
            ComplianceEvaluation.memory_id,
            func.max(ComplianceEvaluation.id).label('max_id')
        ).filter(
            ComplianceEvaluation.policy_id == policy.id,
            ComplianceEvaluation.agent_id == agent_id
        ).group_by(ComplianceEvaluation.memory_id).subquery()

        evaluations = db.query(ComplianceEvaluation).join(
            subquery,
            (ComplianceEvaluation.memory_id == subquery.c.memory_id) &
            (ComplianceEvaluation.id == subquery.c.max_id)
        ).all()

        # Filter to only include evaluations for memories that currently exist
        evaluations = [e for e in evaluations if e.memory_id in current_memory_ids]

        compliant_count = sum(1 for e in evaluations if e.is_compliant)
        total_count = len(evaluations)

        compliance_by_policy[policy.id] = {
            "name": policy.name,
            "policy_type": policy.policy_type,
            "severity": policy.severity,
            "compliant_count": compliant_count,
            "total_count": total_count,
            "compliance_rate": (compliant_count / total_count * 100) if total_count > 0 else 0
        }

    # Get all session statuses (for resolved state, filtered by agent)
    session_statuses = {s.session_id: s for s in db.query(SessionStatus).filter(SessionStatus.agent_id == agent_id).all()}

    # Get compliance status for all memories (both fully and partially evaluated)
    all_memories_data = []
    llm_usage_totals = {
        "total_calls": 0,
        "input_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0,
        "cost_usd": 0.0
    }

    for memory in memories:
        memory_evals = db.query(ComplianceEvaluation).filter(
            ComplianceEvaluation.memory_id == memory["id"],
            ComplianceEvaluation.agent_id == agent_id
        ).all()

        # Skip memories with no evaluations at all
        if not memory_evals:
            continue

        # Check if fully evaluated
        latest_by_policy = _latest_evaluations_by_policy(memory_evals)
        evaluated_policy_ids = set(latest_by_policy.keys())
        stale = False
        for policy in policies:
            ev = latest_by_policy.get(policy.id)
            if ev and policy.updated_at and ev.evaluated_at and policy.updated_at > ev.evaluated_at:
                stale = True
                break
        is_fully_evaluated = enabled_policy_ids and enabled_policy_ids.issubset(evaluated_policy_ids) and not stale

        # Calculate compliance status
        total_evals = len(memory_evals)
        compliant_evals = sum(1 for e in memory_evals if e.is_compliant)
        non_compliant_evals = total_evals - compliant_evals

        # Count total violations
        violation_count = sum(len(e.violations) for e in memory_evals if not e.is_compliant)

        # Get policies violated
        policies_violated = []
        policies_passed = []

        for eval in memory_evals:
            policy = db.query(Policy).filter(Policy.id == eval.policy_id).first()
            if policy:
                if not eval.is_compliant:
                    policies_violated.append({
                        "policy_id": policy.id,
                        "policy_name": policy.name,
                        "severity": policy.severity,
                        "violations": eval.violations
                    })
                else:
                    policies_passed.append({
                        "policy_id": policy.id,
                        "policy_name": policy.name,
                        "severity": policy.severity
                    })

            # Accumulate LLM usage from latest evaluation only to avoid double counting
            latest_ev = latest_by_policy.get(policy.id)
            if latest_ev:
                usages = _collect_llm_usage(latest_ev.violations)
                for usage in usages:
                    llm_usage_totals["total_calls"] += 1
                    llm_usage_totals["input_tokens"] += usage.get("input_tokens", 0)
                    llm_usage_totals["output_tokens"] += usage.get("output_tokens", 0)
                    llm_usage_totals["total_tokens"] += usage.get("total_tokens", 0)
                    llm_usage_totals["cost_usd"] += usage.get("cost_usd", 0.0)

        # Check for resolved status
        session_status = session_statuses.get(memory["id"])
        is_resolved = session_status and session_status.compliance_status == 'resolved'

        # Determine compliance_status: 'compliant', 'issues', or 'resolved'
        if is_resolved:
            compliance_status = 'resolved'
        elif non_compliant_evals == 0:
            compliance_status = 'compliant'
        else:
            compliance_status = 'issues'

        all_memories_data.append({
            "memory_id": memory["id"],
            "memory_name": memory["name"],
            "is_compliant": non_compliant_evals == 0,
            "compliance_status": compliance_status,
            "is_fully_evaluated": is_fully_evaluated,
            "needs_reprocessing": stale,
            "evaluated_policy_count": len(evaluated_policy_ids),
            "total_policy_count": len(enabled_policy_ids),
            "resolved_at": session_status.resolved_at.isoformat() if is_resolved and session_status.resolved_at else None,
            "resolved_by": session_status.resolved_by if is_resolved else None,
            "total_evaluations": total_evals,
            "compliant_evaluations": compliant_evals,
            "non_compliant_evaluations": non_compliant_evals,
            "violation_count": violation_count,
            "policies_violated": policies_violated,
            "policies_passed": policies_passed
        })

    # Get non-compliant memories for backward compatibility
    non_compliant_memories = [m for m in all_memories_data if not m["is_compliant"]]

    return ComplianceSummary(
        total_memories=total_memories,
        processed_memories=len(processed_memory_ids),
        total_policies=total_policies,
        compliance_by_policy=compliance_by_policy,
        non_compliant_memories=non_compliant_memories,
        all_memories=all_memories_data,
        llm_usage_totals=llm_usage_totals
    )


@router.get("/{agent_id}/memory/{memory_id}", response_model=List[ComplianceEvaluationResponse])
async def get_memory_evaluations(agent_id: str, memory_id: str, db: Session = Depends(get_db)):
    """Get all compliance evaluations for a specific memory."""
    memory = memory_loader.get_memory(agent_id=agent_id, memory_id=memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    evaluations = db.query(ComplianceEvaluation).filter(
        ComplianceEvaluation.memory_id == memory_id,
        ComplianceEvaluation.agent_id == agent_id
    ).all()

    # Enrich evaluations with policy names and separate violations from compliance_details
    result = []
    for evaluation in evaluations:
        eval_dict = {
            "id": evaluation.id,
            "memory_id": evaluation.memory_id,
            "policy_id": evaluation.policy_id,
            "policy_name": evaluation.policy.name if evaluation.policy else None,
            "policy_description": evaluation.policy.description if evaluation.policy else None,
            "policy_severity": evaluation.policy.severity if evaluation.policy else 'error',
            "is_compliant": evaluation.is_compliant,
            "violations": evaluation.violations if not evaluation.is_compliant else [],
            "compliance_details": evaluation.violations if evaluation.is_compliant else None,
            "evaluated_at": evaluation.evaluated_at
        }
        result.append(eval_dict)

    return result


@router.post("/{agent_id}/process-batch", response_model=ProcessBatchResponse)
async def process_batch(agent_id: str, request: ProcessBatchRequest, db: Session = Depends(get_db)):
    """Process multiple memories: evaluate compliance and optionally refresh variants."""
    evaluator = PolicyEvaluator()
    policies = db.query(Policy).filter(
        Policy.enabled == True,
        Policy.agent_id == agent_id
    ).all()
    results = []

    for memory_id in request.memory_ids:
        memory = memory_loader.get_memory(agent_id=agent_id, memory_id=memory_id)
        if not memory:
            results.append({"memory_id": memory_id, "status": "not_found"})
            continue

        # Evaluate against all enabled policies
        eval_count = 0
        for policy in policies:
            # Delete existing evaluation for this memory-policy pair
            db.query(ComplianceEvaluation).filter(
                ComplianceEvaluation.memory_id == memory_id,
                ComplianceEvaluation.policy_id == policy.id,
                ComplianceEvaluation.agent_id == agent_id
            ).delete()

            # Evaluate
            config_with_metadata = {
                **policy.config,
                'name': policy.name,
                'description': policy.description
            }
            is_compliant, details = evaluator.evaluate(
                memory["messages"],
                policy.policy_type,
                config_with_metadata
            )

            # Save evaluation
            evaluation = ComplianceEvaluation(
                agent_id=agent_id,
                memory_id=memory_id,
                policy_id=policy.id,
                is_compliant=is_compliant,
                violations=details
            )
            db.add(evaluation)
            eval_count += 1

        db.commit()
        results.append({
            "memory_id": memory_id,
            "status": "success",
            "evaluations": eval_count
        })

    # Refresh agent variants if requested
    if request.refresh_variants:
        _compute_and_store_variants(db, agent_id=agent_id)

    return ProcessBatchResponse(
        processed=len([r for r in results if r.get("status") == "success"]),
        results=results,
        variants_refreshed=request.refresh_variants
    )


@router.delete("/{agent_id}/reset")
async def reset_evaluations(agent_id: str, db: Session = Depends(get_db)):
    """Delete all compliance evaluations, agent variants, and session statuses for a specific agent."""
    eval_count = db.query(ComplianceEvaluation).filter(ComplianceEvaluation.agent_id == agent_id).delete()
    db.query(ToolTransition).filter(ToolTransition.agent_id == agent_id).delete()
    variant_count = db.query(AgentVariant).filter(AgentVariant.agent_id == agent_id).delete()
    session_status_count = db.query(SessionStatus).filter(SessionStatus.agent_id == agent_id).delete()
    db.commit()
    return {
        "message": f"All evaluations reset for agent {agent_id}",
        "evaluations_deleted": eval_count,
        "variants_deleted": variant_count,
        "session_statuses_deleted": session_status_count
    }
