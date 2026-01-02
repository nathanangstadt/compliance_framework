from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

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


@router.post("/evaluate", response_model=List[ComplianceEvaluationResponse])
async def evaluate_memory(request: EvaluateMemoryRequest, db: Session = Depends(get_db)):
    """Evaluate an agent memory against policies."""
    memory = memory_loader.get_memory(request.memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    # Get policies to evaluate against
    if request.policy_ids:
        policies = db.query(Policy).filter(Policy.id.in_(request.policy_ids)).all()
    else:
        policies = db.query(Policy).filter(Policy.enabled == True).all()

    evaluator = PolicyEvaluator()
    results = []

    for policy in policies:
        # Delete existing evaluation for this memory-policy pair
        db.query(ComplianceEvaluation).filter(
            ComplianceEvaluation.memory_id == request.memory_id,
            ComplianceEvaluation.policy_id == policy.id
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


@router.get("/summary", response_model=ComplianceSummary)
async def get_compliance_summary(db: Session = Depends(get_db)):
    """Get overall compliance summary."""
    memories = memory_loader.list_memories()
    total_memories = len(memories)
    total_policies = db.query(Policy).filter(Policy.enabled == True).count()

    policies = db.query(Policy).filter(Policy.enabled == True).all()
    enabled_policy_ids = {p.id for p in policies}

    # Get list of current memory IDs
    current_memory_ids = {m["id"] for m in memories}

    # Determine which memories are fully processed (evaluated against all enabled policies)
    processed_memory_ids = set()
    for memory in memories:
        memory_id = memory["id"]
        evals = db.query(ComplianceEvaluation).filter(
            ComplianceEvaluation.memory_id == memory_id
        ).all()
        evaluated_policy_ids = {e.policy_id for e in evals}
        if enabled_policy_ids and enabled_policy_ids.issubset(evaluated_policy_ids):
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
            ComplianceEvaluation.policy_id == policy.id
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

    # Get all session statuses (for resolved state)
    session_statuses = {s.session_id: s for s in db.query(SessionStatus).all()}

    # Get compliance status only for processed memories (fully evaluated)
    all_memories_data = []

    for memory in memories:
        # Skip memories that haven't been fully processed
        if memory["id"] not in processed_memory_ids:
            continue
        memory_evals = db.query(ComplianceEvaluation).filter(
            ComplianceEvaluation.memory_id == memory["id"]
        ).all()

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
        all_memories=all_memories_data
    )


@router.get("/memory/{memory_id}", response_model=List[ComplianceEvaluationResponse])
async def get_memory_evaluations(memory_id: str, db: Session = Depends(get_db)):
    """Get all compliance evaluations for a specific memory."""
    memory = memory_loader.get_memory(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    evaluations = db.query(ComplianceEvaluation).filter(
        ComplianceEvaluation.memory_id == memory_id
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


@router.post("/process-batch", response_model=ProcessBatchResponse)
async def process_batch(request: ProcessBatchRequest, db: Session = Depends(get_db)):
    """Process multiple memories: evaluate compliance and optionally refresh variants."""
    evaluator = PolicyEvaluator()
    policies = db.query(Policy).filter(Policy.enabled == True).all()
    results = []

    for memory_id in request.memory_ids:
        memory = memory_loader.get_memory(memory_id)
        if not memory:
            results.append({"memory_id": memory_id, "status": "not_found"})
            continue

        # Evaluate against all enabled policies
        eval_count = 0
        for policy in policies:
            # Delete existing evaluation for this memory-policy pair
            db.query(ComplianceEvaluation).filter(
                ComplianceEvaluation.memory_id == memory_id,
                ComplianceEvaluation.policy_id == policy.id
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
        _compute_and_store_variants(db)

    return ProcessBatchResponse(
        processed=len([r for r in results if r.get("status") == "success"]),
        results=results,
        variants_refreshed=request.refresh_variants
    )


@router.delete("/reset")
async def reset_evaluations(db: Session = Depends(get_db)):
    """Delete all compliance evaluations, agent variants, and session statuses."""
    eval_count = db.query(ComplianceEvaluation).delete()
    db.query(ToolTransition).delete()
    variant_count = db.query(AgentVariant).delete()
    session_status_count = db.query(SessionStatus).delete()
    db.commit()
    return {
        "message": "All evaluations reset",
        "evaluations_deleted": eval_count,
        "variants_deleted": variant_count,
        "session_statuses_deleted": session_status_count
    }
