from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float, Boolean, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class AgentMemory(Base):
    __tablename__ = "agent_memories"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    messages = Column(JSON, nullable=False)
    memory_metadata = Column(JSON, default={})


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    policy_type = Column(String, nullable=False)  # currently always 'composite'
    config = Column(JSON, nullable=False)
    enabled = Column(Boolean, default=True)
    severity = Column(String, default='error')  # 'error', 'warning', 'info'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    _nocode_nodes = Column(JSON, nullable=True)  # Store no-code editor nodes for re-editing

    evaluations = relationship("ComplianceEvaluation", back_populates="policy", cascade="all, delete-orphan")


class ComplianceEvaluation(Base):
    __tablename__ = "compliance_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String, nullable=False, index=True)
    memory_id = Column(String, nullable=False, index=True)  # File-based ID (filename without extension)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)
    is_compliant = Column(Boolean, nullable=False)
    violations = Column(JSON, default=[])  # List of violation details
    evaluated_at = Column(DateTime, default=datetime.utcnow)

    policy = relationship("Policy", back_populates="evaluations")


class AgentVariant(Base):
    """Represents a unique tool usage pattern identified across agent instances."""
    __tablename__ = "agent_variants"
    __table_args__ = (UniqueConstraint('agent_id', 'signature', name='uq_agent_variant_signature'),)

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String, nullable=False, index=True)
    signature = Column(String, nullable=False, index=True)  # SHA256 hash for fast lookup (unique per agent)
    name = Column(String, nullable=False)  # Auto-generated or user-assigned name
    normalized_sequence = Column(JSON, nullable=False)  # List of tool names (normalized, no cycles)
    sequence_display = Column(String, nullable=False)  # Human-readable: "tool_a → tool_b → tool_c"
    memory_ids = Column(JSON, default=[])  # List of memory IDs matching this pattern
    tool_count = Column(Integer, nullable=False)  # Number of unique tools in pattern
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transitions = relationship("ToolTransition", back_populates="variant", cascade="all, delete-orphan")


class ToolTransition(Base):
    """Tracks tool-to-tool transition counts for flow diagram visualization."""
    __tablename__ = "tool_transitions"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String, nullable=False, index=True)
    from_tool = Column(String, nullable=False, index=True)  # Source tool name (or "_start" for first tool)
    to_tool = Column(String, nullable=False, index=True)  # Target tool name (or "_end" for last tool)
    count = Column(Integer, default=0)  # Number of times this transition occurred
    variant_id = Column(Integer, ForeignKey("agent_variants.id"), nullable=True)  # Null = aggregate across all

    variant = relationship("AgentVariant", back_populates="transitions")


class SessionStatus(Base):
    """
    Tracks session-level status including compliance resolution state.

    processing_status: Computed from evaluations (not stored here)
    compliance_status: Persisted status that can be marked as resolved
    """
    __tablename__ = "session_status"

    session_id = Column(String, primary_key=True, index=True)  # Matches memory_id
    agent_id = Column(String, nullable=False, index=True)
    compliance_status = Column(String, nullable=True)  # null | 'compliant' | 'issues' | 'resolved'
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String, nullable=True)  # User who marked it resolved
    resolution_notes = Column(Text, nullable=True)  # Optional notes about resolution
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ProcessingJob(Base):
    """
    Tracks async processing jobs for batch session evaluation.

    Jobs are created when user submits batch processing request,
    and polled for status until completion.
    """
    __tablename__ = "processing_jobs"

    id = Column(String, primary_key=True, index=True)  # UUID
    agent_id = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default='pending')  # pending | running | completed | failed
    job_type = Column(String, nullable=False, default='batch_evaluate')  # batch_evaluate | single_evaluate

    # Progress tracking
    total_items = Column(Integer, default=0)
    completed_items = Column(Integer, default=0)
    failed_items = Column(Integer, default=0)

    # Input/output
    input_data = Column(JSON, default={})  # memory_ids, policy_ids, etc.
    results = Column(JSON, default=[])  # Results for each processed item
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
