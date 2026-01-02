"""
Agent Variants API routes.
Provides endpoints for analyzing and querying tool usage patterns across agent instances.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from collections import defaultdict

from app.database import get_db
from app.models import AgentVariant, ToolTransition, ComplianceEvaluation, Policy
from app.schemas import (
    AgentVariantListResponse,
    AgentVariantSummary,
    AgentVariantDetail,
    ToolTransitionsResponse,
    ToolTransitionResponse
)
from app.services.pattern_extractor import pattern_extractor
from app.services.memory_loader import memory_loader

router = APIRouter(prefix="/api/agent-variants", tags=["agent-variants"])


def _compute_and_store_variants(db: Session) -> None:
    """
    Compute patterns from processed memories and store in database.
    Clears existing data and recomputes from scratch.
    Only includes memories that have compliance evaluations for all enabled policies.
    """
    # Clear existing data
    db.query(ToolTransition).delete()
    db.query(AgentVariant).delete()
    db.commit()

    # Load all memories
    memories = memory_loader.list_memories()
    if not memories:
        return

    # Get enabled policies to determine which memories are "processed"
    enabled_policies = db.query(Policy).filter(Policy.enabled == True).all()
    enabled_policy_ids = {p.id for p in enabled_policies}

    # Filter to only processed memories (evaluated against all enabled policies)
    processed_memory_ids = set()
    for memory_meta in memories:
        memory_id = memory_meta["id"]
        evals = db.query(ComplianceEvaluation).filter(
            ComplianceEvaluation.memory_id == memory_id
        ).all()
        evaluated_policy_ids = {e.policy_id for e in evals}
        if enabled_policy_ids and enabled_policy_ids.issubset(evaluated_policy_ids):
            processed_memory_ids.add(memory_id)

    # Only process memories that have been evaluated
    processed_memories = [m for m in memories if m["id"] in processed_memory_ids]
    if not processed_memories:
        return

    # Process each memory to extract patterns
    pattern_map = defaultdict(list)  # signature -> list of memory_ids
    all_raw_sequences = []

    for memory_meta in processed_memories:
        memory = memory_loader.get_memory(memory_meta["id"])
        if not memory:
            continue

        messages = memory.get("messages", [])
        raw_sequence, _ = pattern_extractor.extract_tool_sequence(messages)

        if raw_sequence:
            all_raw_sequences.append(raw_sequence)

        # Normalize and get signature
        normalized = pattern_extractor.normalize_sequence(raw_sequence)
        signature = pattern_extractor.generate_signature(normalized)

        pattern_map[signature.hash].append({
            "memory_id": memory_meta["id"],
            "signature": signature
        })

    # Create AgentVariant records
    for sig_hash, entries in pattern_map.items():
        if not entries:
            continue

        signature = entries[0]["signature"]
        memory_ids = [e["memory_id"] for e in entries]

        # Generate name
        name = pattern_extractor.generate_pattern_name(signature.normalized_sequence)

        variant = AgentVariant(
            signature=sig_hash,
            name=name,
            normalized_sequence=signature.normalized_sequence,
            sequence_display=signature.display_string,
            memory_ids=memory_ids,
            tool_count=signature.tool_count
        )
        db.add(variant)

    db.commit()

    # Compute and store transitions
    transitions = pattern_extractor.compute_transitions(all_raw_sequences)

    for (from_tool, to_tool), count in transitions.items():
        transition = ToolTransition(
            from_tool=from_tool,
            to_tool=to_tool,
            count=count,
            variant_id=None  # Aggregate across all variants
        )
        db.add(transition)

    db.commit()


@router.get("/", response_model=AgentVariantListResponse)
async def list_agent_variants(
    refresh: bool = False,
    db: Session = Depends(get_db)
):
    """
    List all unique agent variant patterns with session counts.

    Args:
        refresh: If true, recompute patterns from all memories
    """
    # Only recompute if explicitly requested via refresh parameter
    # Do NOT auto-compute when empty - variants should only exist after processing
    if refresh:
        _compute_and_store_variants(db)

    # Get all variants
    variants = db.query(AgentVariant).all()
    total_sessions = sum(len(v.memory_ids) for v in variants)

    # Build response
    variant_summaries = []
    for variant in variants:
        session_count = len(variant.memory_ids)
        percentage = (session_count / total_sessions * 100) if total_sessions > 0 else 0

        # Create preview (first 3 tools)
        sequence_preview = " → ".join(variant.normalized_sequence[:3])
        if len(variant.normalized_sequence) > 3:
            sequence_preview += " → ..."

        variant_summaries.append(AgentVariantSummary(
            id=variant.id,
            name=variant.name,
            signature=variant.signature,
            session_count=session_count,
            percentage=round(percentage, 1),
            tool_count=variant.tool_count,
            sequence_preview=sequence_preview
        ))

    # Sort by session count descending
    variant_summaries.sort(key=lambda v: v.session_count, reverse=True)

    return AgentVariantListResponse(
        variants=variant_summaries,
        total_sessions=total_sessions,
        unique_patterns=len(variants)
    )


@router.get("/transitions", response_model=ToolTransitionsResponse)
async def get_tool_transitions(
    variant_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get aggregated tool transition counts for flow diagram visualization.

    Args:
        variant_id: Optional filter to specific variant (not yet implemented)
    """
    # Do NOT auto-compute - transitions should only exist after processing

    # Query transitions (aggregate for now)
    query = db.query(ToolTransition)
    if variant_id:
        query = query.filter(ToolTransition.variant_id == variant_id)
    else:
        query = query.filter(ToolTransition.variant_id.is_(None))

    transitions = query.all()

    # Collect unique tools
    unique_tools = set()
    transition_responses = []

    for t in transitions:
        if t.from_tool != "_start":
            unique_tools.add(t.from_tool)
        if t.to_tool != "_end":
            unique_tools.add(t.to_tool)

        transition_responses.append(ToolTransitionResponse(
            from_tool=t.from_tool,
            to_tool=t.to_tool,
            count=t.count
        ))

    # Sort transitions by count descending
    transition_responses.sort(key=lambda t: t.count, reverse=True)

    return ToolTransitionsResponse(
        transitions=transition_responses,
        unique_tools=sorted(list(unique_tools))
    )


@router.get("/{variant_id}", response_model=AgentVariantDetail)
async def get_agent_variant(
    variant_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific agent variant pattern."""
    variant = db.query(AgentVariant).filter(AgentVariant.id == variant_id).first()

    if not variant:
        raise HTTPException(status_code=404, detail="Agent variant not found")

    # Calculate stats
    total_variants = db.query(AgentVariant).count()
    all_memory_count = sum(
        len(v.memory_ids)
        for v in db.query(AgentVariant).all()
    )

    session_count = len(variant.memory_ids)
    percentage = (session_count / all_memory_count * 100) if all_memory_count > 0 else 0

    return AgentVariantDetail(
        id=variant.id,
        name=variant.name,
        signature=variant.signature,
        normalized_sequence=variant.normalized_sequence,
        sequence_display=variant.sequence_display,
        memory_ids=variant.memory_ids,
        session_count=session_count,
        percentage=round(percentage, 1),
        tool_count=variant.tool_count,
        created_at=variant.created_at
    )


@router.post("/refresh")
async def refresh_variants(db: Session = Depends(get_db)):
    """Force recomputation of all patterns from memories."""
    _compute_and_store_variants(db)

    variant_count = db.query(AgentVariant).count()
    transition_count = db.query(ToolTransition).count()

    return {
        "message": "Successfully refreshed agent variants",
        "variants_computed": variant_count,
        "transitions_computed": transition_count
    }
