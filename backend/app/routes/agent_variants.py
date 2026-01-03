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


def _compute_and_store_variants(db: Session, agent_id: str) -> None:
    """
    Compute patterns from processed sessions and store in database.
    Clears existing data for this agent and recomputes from scratch.

    Only includes sessions that have been evaluated against at least one policy.
    This ensures we only analyze sessions that have been through the compliance pipeline.
    """
    # Clear existing data for this agent
    db.query(ToolTransition).filter(ToolTransition.agent_id == agent_id).delete()
    db.query(AgentVariant).filter(AgentVariant.agent_id == agent_id).delete()
    db.commit()

    # Load all memories for this agent
    memories = memory_loader.list_memories(agent_id=agent_id)
    if not memories:
        return

    # Filter to only processed memories (evaluated against at least one policy)
    processed_memory_ids = set()
    for memory_meta in memories:
        memory_id = memory_meta["id"]
        evals = db.query(ComplianceEvaluation).filter(
            ComplianceEvaluation.memory_id == memory_id,
            ComplianceEvaluation.agent_id == agent_id
        ).all()
        if len(evals) > 0:  # Has been evaluated against at least one policy
            processed_memory_ids.add(memory_id)

    # Only process memories that have been evaluated
    processed_memories = [m for m in memories if m["id"] in processed_memory_ids]
    if not processed_memories:
        return

    # Process each memory to extract patterns
    pattern_map = defaultdict(list)  # signature -> list of memory_ids
    all_raw_sequences = []

    for memory_meta in processed_memories:
        memory = memory_loader.get_memory(agent_id=agent_id, memory_id=memory_meta["id"])
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
            agent_id=agent_id,
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
            agent_id=agent_id,
            from_tool=from_tool,
            to_tool=to_tool,
            count=count,
            variant_id=None  # Aggregate across all variants
        )
        db.add(transition)

    db.commit()


@router.get("/{agent_id}/", response_model=AgentVariantListResponse)
async def list_agent_variants(
    agent_id: str,
    refresh: bool = False,
    db: Session = Depends(get_db)
):
    """
    List all unique agent variant patterns with session counts for a specific agent.

    Args:
        agent_id: The agent identifier
        refresh: If true, recompute patterns from all memories
    """
    # Only recompute if explicitly requested via refresh parameter
    # Do NOT auto-compute when empty - variants should only exist after processing
    if refresh:
        _compute_and_store_variants(db, agent_id=agent_id)

    # Get all variants for this agent
    variants = db.query(AgentVariant).filter(AgentVariant.agent_id == agent_id).all()
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


@router.get("/{agent_id}/transitions", response_model=ToolTransitionsResponse)
async def get_tool_transitions(
    agent_id: str,
    variant_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get aggregated tool transition counts for flow diagram visualization.

    Args:
        agent_id: The agent identifier
        variant_id: Optional filter to specific variant (not yet implemented)
    """
    # Do NOT auto-compute - transitions should only exist after processing

    # Query transitions (aggregate for now, filtered by agent)
    query = db.query(ToolTransition).filter(ToolTransition.agent_id == agent_id)
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


@router.get("/{agent_id}/{variant_id}", response_model=AgentVariantDetail)
async def get_agent_variant(
    agent_id: str,
    variant_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific agent variant pattern."""
    variant = db.query(AgentVariant).filter(
        AgentVariant.id == variant_id,
        AgentVariant.agent_id == agent_id
    ).first()

    if not variant:
        raise HTTPException(status_code=404, detail="Agent variant not found")

    # Calculate stats (scoped to this agent)
    total_variants = db.query(AgentVariant).filter(AgentVariant.agent_id == agent_id).count()
    all_memory_count = sum(
        len(v.memory_ids)
        for v in db.query(AgentVariant).filter(AgentVariant.agent_id == agent_id).all()
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


@router.post("/{agent_id}/refresh")
async def refresh_variants(agent_id: str, db: Session = Depends(get_db)):
    """Force recomputation of all patterns from memories for a specific agent."""
    _compute_and_store_variants(db, agent_id=agent_id)

    variant_count = db.query(AgentVariant).filter(AgentVariant.agent_id == agent_id).count()
    transition_count = db.query(ToolTransition).filter(ToolTransition.agent_id == agent_id).count()

    return {
        "message": f"Successfully refreshed agent variants for {agent_id}",
        "variants_computed": variant_count,
        "transitions_computed": transition_count
    }
