from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime

from app.database import get_db
from app.models import Policy, ComplianceEvaluation, AgentVariant
from app.services.memory_loader import memory_loader

router = APIRouter(prefix="/api/memories", tags=["memories"])


@router.get("/")
async def list_memories(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """List all agent memories from the filesystem with processing status."""
    memories = memory_loader.list_memories()

    # Get enabled policies for status calculation
    enabled_policies = db.query(Policy).filter(Policy.enabled == True).all()
    enabled_policy_ids = {p.id for p in enabled_policies}

    # Get all variants to check which memories are in variant patterns
    variants = db.query(AgentVariant).all()
    memories_in_variants = set()
    for v in variants:
        if v.memory_ids:
            memories_in_variants.update(v.memory_ids)

    # Format response with processing status
    result = []
    for m in memories:
        memory_id = m["id"]

        # Check compliance evaluations for this memory
        evals = db.query(ComplianceEvaluation).filter(
            ComplianceEvaluation.memory_id == memory_id
        ).all()
        evaluated_policy_ids = {e.policy_id for e in evals}

        # Determine if fully evaluated (all enabled policies)
        has_compliance = enabled_policy_ids.issubset(evaluated_policy_ids) if enabled_policy_ids else False
        has_variants = memory_id in memories_in_variants

        result.append({
            "id": memory_id,
            "name": m["name"],
            "uploaded_at": datetime.fromtimestamp(m["uploaded_at"]).isoformat(),
            "messages": m["messages"],
            "message_count": m["message_count"],
            "processing_status": {
                "is_processed": has_compliance and has_variants,
                "has_compliance": has_compliance,
                "has_variants": has_variants,
                "policies_evaluated": len(evaluated_policy_ids),
                "policies_total": len(enabled_policy_ids)
            }
        })

    return result


@router.get("/{memory_id}")
async def get_memory(memory_id: str) -> Dict[str, Any]:
    """Get a specific agent memory by ID (filename without extension)."""
    memory = memory_loader.get_memory(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    # Format response to match frontend expectations
    return {
        "id": memory["id"],
        "name": memory["name"],
        "uploaded_at": datetime.fromtimestamp(memory["uploaded_at"]).isoformat(),
        "messages": memory["messages"],
        "message_count": memory["message_count"]
    }
