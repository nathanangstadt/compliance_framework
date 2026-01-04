from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.database import get_db
from app.models import Policy, ComplianceEvaluation, AgentVariant, SessionStatus
from app.services.memory_loader import memory_loader
from app.schemas import ResolveSessionRequest

router = APIRouter(prefix="/api/memories", tags=["memories"])


def _compute_compliance_status(
    db: Session,
    memory_id: str,
    has_compliance: bool,
    session_status: Optional[SessionStatus]
) -> Dict[str, Any]:
    """
    Compute the compliance status for a session.

    Logic:
    - If resolved in DB, return 'resolved' with resolution details
    - If has compliance evaluations, check if all passed
    - Otherwise return null status
    """
    # Check for persisted resolved status
    if session_status and session_status.compliance_status == 'resolved':
        return {
            "status": "resolved",
            "resolved_at": session_status.resolved_at.isoformat() if session_status.resolved_at else None,
            "resolved_by": session_status.resolved_by,
            "resolution_notes": session_status.resolution_notes
        }

    # If not processed yet, no compliance status
    if not has_compliance:
        return {
            "status": None,
            "resolved_at": None,
            "resolved_by": None,
            "resolution_notes": None
        }

    # Check if all evaluations passed
    evals = db.query(ComplianceEvaluation).filter(
        ComplianceEvaluation.memory_id == memory_id
    ).all()

    all_compliant = all(e.is_compliant for e in evals)

    return {
        "status": "compliant" if all_compliant else "issues",
        "resolved_at": None,
        "resolved_by": None,
        "resolution_notes": None
    }


def _format_metadata(raw_metadata: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Format metadata for API response, converting datetime objects to ISO strings."""
    if not raw_metadata:
        return None

    result = {}
    for key, value in raw_metadata.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result


def _evaluation_stale(enabled_policies: List[Policy], evaluations: List[ComplianceEvaluation]) -> bool:
    """
    Returns True if any enabled policy was updated after the last evaluation for that policy.
    """
    eval_map = {e.policy_id: e for e in evaluations}
    for policy in enabled_policies:
        ev = eval_map.get(policy.id)
        if not ev:
            continue  # handled elsewhere as not fully evaluated
        if policy.updated_at and ev.evaluated_at and policy.updated_at > ev.evaluated_at:
            return True
    return False


@router.get("/{agent_id}/")
async def list_memories(agent_id: str, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """List all sessions from the filesystem with processing and compliance status."""
    memories = memory_loader.list_memories(agent_id=agent_id)

    # Get enabled policies for status calculation (filtered by agent)
    enabled_policies = db.query(Policy).filter(
        Policy.enabled == True,
        Policy.agent_id == agent_id
    ).all()
    enabled_policy_ids = {p.id for p in enabled_policies}

    # Get all variants to check which memories are in variant patterns (filtered by agent)
    variants = db.query(AgentVariant).filter(AgentVariant.agent_id == agent_id).all()
    memories_in_variants = set()
    for v in variants:
        if v.memory_ids:
            memories_in_variants.update(v.memory_ids)

    # Get all session statuses (filtered by agent)
    session_statuses = {s.session_id: s for s in db.query(SessionStatus).filter(SessionStatus.agent_id == agent_id).all()}

    # Format response with processing and compliance status
    result = []
    for m in memories:
        memory_id = m["id"]

        # Check compliance evaluations for this memory (filtered by agent)
        evals = db.query(ComplianceEvaluation).filter(
            ComplianceEvaluation.memory_id == memory_id,
            ComplianceEvaluation.agent_id == agent_id
        ).all()
        evaluated_policy_ids = {e.policy_id for e in evals}

        # Determine staleness (policy updated after evaluation)
        stale = _evaluation_stale(enabled_policies, evals) if evals else False

        # Determine if fully evaluated (all enabled policies) and fresh
        all_policies_evaluated = enabled_policy_ids.issubset(evaluated_policy_ids) if enabled_policy_ids else False
        has_compliance = all_policies_evaluated and not stale
        has_variants = memory_id in memories_in_variants

        # Get session status from DB
        session_status = session_statuses.get(memory_id)

        # A session is "processed" if it has been evaluated against at least one policy
        # Partial processing means evaluated against some but not all enabled policies
        is_processed = len(evaluated_policy_ids) > 0
        is_fully_evaluated = all_policies_evaluated and not stale

        result.append({
            "id": memory_id,
            "name": m["name"],
            "uploaded_at": datetime.fromtimestamp(m["uploaded_at"]).isoformat(),
            "messages": m["messages"],
            "message_count": m["message_count"],
            "metadata": _format_metadata(m.get("metadata")),
            "processing_status": {
                "is_processed": is_processed,  # Has been evaluated against at least one policy
                "is_fully_evaluated": is_fully_evaluated,  # Evaluated against ALL enabled policies and not stale
                "needs_reprocessing": stale,
                "has_compliance": has_compliance,
                "has_variants": has_variants,
                "policies_evaluated": len(evaluated_policy_ids),
                "policies_total": len(enabled_policy_ids)
            },
            "compliance_status": _compute_compliance_status(db, memory_id, has_compliance, session_status)
        })

    return result


@router.get("/{agent_id}/{memory_id}")
async def get_memory(agent_id: str, memory_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get a specific session by ID (filename without extension)."""
    memory = memory_loader.get_memory(agent_id=agent_id, memory_id=memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get enabled policies for status calculation (filtered by agent)
    enabled_policies = db.query(Policy).filter(
        Policy.enabled == True,
        Policy.agent_id == agent_id
    ).all()
    enabled_policy_ids = {p.id for p in enabled_policies}

    # Check compliance evaluations (filtered by agent)
    evals = db.query(ComplianceEvaluation).filter(
        ComplianceEvaluation.memory_id == memory_id,
        ComplianceEvaluation.agent_id == agent_id
    ).all()
    evaluated_policy_ids = {e.policy_id for e in evals}
    stale = _evaluation_stale(enabled_policies, evals) if evals else False
    has_compliance = enabled_policy_ids.issubset(evaluated_policy_ids) and not stale if enabled_policy_ids else False

    # Check variants (filtered by agent)
    variants = db.query(AgentVariant).filter(AgentVariant.agent_id == agent_id).all()
    has_variants = any(memory_id in (v.memory_ids or []) for v in variants)

    # Get session status (filtered by agent)
    session_status = db.query(SessionStatus).filter(
        SessionStatus.session_id == memory_id,
        SessionStatus.agent_id == agent_id
    ).first()

    # A session is "processed" if it has been evaluated against at least one policy
    # Partial processing means evaluated against some but not all enabled policies
    is_processed = len(evaluated_policy_ids) > 0
    is_fully_evaluated = enabled_policy_ids.issubset(evaluated_policy_ids) and not stale if enabled_policy_ids else False

    return {
        "id": memory["id"],
        "name": memory["name"],
        "uploaded_at": datetime.fromtimestamp(memory["uploaded_at"]).isoformat(),
        "messages": memory["messages"],
        "message_count": memory["message_count"],
        "metadata": _format_metadata(memory.get("metadata")),
            "processing_status": {
                "is_processed": is_processed,  # Has been evaluated against at least one policy
                "is_fully_evaluated": is_fully_evaluated,  # Evaluated against ALL enabled policies and not stale
                "needs_reprocessing": stale,
                "has_compliance": has_compliance,
                "has_variants": has_variants,
                "policies_evaluated": len(evaluated_policy_ids),
                "policies_total": len(enabled_policy_ids)
        },
        "compliance_status": _compute_compliance_status(db, memory_id, has_compliance, session_status)
    }


@router.post("/{agent_id}/{memory_id}/resolve")
async def resolve_session(
    agent_id: str,
    memory_id: str,
    request: ResolveSessionRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Mark a session's compliance issues as resolved."""
    # Verify session exists
    memory = memory_loader.get_memory(agent_id=agent_id, memory_id=memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get or create session status
    session_status = db.query(SessionStatus).filter(
        SessionStatus.session_id == memory_id,
        SessionStatus.agent_id == agent_id
    ).first()

    if session_status:
        session_status.compliance_status = "resolved"
        session_status.resolved_at = datetime.utcnow()
        session_status.resolved_by = request.resolved_by
        session_status.resolution_notes = request.resolution_notes
    else:
        session_status = SessionStatus(
            agent_id=agent_id,
            session_id=memory_id,
            compliance_status="resolved",
            resolved_at=datetime.utcnow(),
            resolved_by=request.resolved_by,
            resolution_notes=request.resolution_notes
        )
        db.add(session_status)

    db.commit()

    return {
        "message": "Session marked as resolved",
        "session_id": memory_id,
        "resolved_at": session_status.resolved_at.isoformat(),
        "resolved_by": session_status.resolved_by
    }


@router.post("/{agent_id}/{memory_id}/unresolve")
async def unresolve_session(agent_id: str, memory_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Remove resolved status from a session, returning it to issues state."""
    session_status = db.query(SessionStatus).filter(
        SessionStatus.session_id == memory_id,
        SessionStatus.agent_id == agent_id
    ).first()

    if not session_status:
        raise HTTPException(status_code=404, detail="No resolved status found for this session")

    # Clear the resolved state
    session_status.compliance_status = None
    session_status.resolved_at = None
    session_status.resolved_by = None
    session_status.resolution_notes = None

    db.commit()

    return {
        "message": "Session resolution status removed",
        "session_id": memory_id
    }
