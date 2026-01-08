from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime


# Agent Memory Schemas
class AgentMemoryCreate(BaseModel):
    name: str
    messages: List[Dict[str, Any]]
    memory_metadata: Optional[Dict[str, Any]] = {}


class AgentMemoryResponse(BaseModel):
    id: int
    name: str
    uploaded_at: datetime
    messages: List[Dict[str, Any]]
    memory_metadata: Dict[str, Any]

    class Config:
        from_attributes = True


class PolicyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    policy_type: Literal["composite"] = "composite"
    config: Dict[str, Any]
    enabled: bool = True
    severity: str = 'error'  # 'error', 'warning', 'info'
    _nocode_nodes: Optional[List[Dict[str, Any]]] = None


class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    enabled: Optional[bool] = None
    severity: Optional[str] = None  # 'error', 'warning', 'info'
    _nocode_nodes: Optional[List[Dict[str, Any]]] = None


class PolicyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    policy_type: str
    config: Dict[str, Any]
    enabled: bool
    severity: str
    created_at: datetime
    updated_at: datetime
    _nocode_nodes: Optional[List[Dict[str, Any]]] = None
    evaluated_sessions: Optional[int] = None  # How many sessions have up-to-date evaluations for this policy
    total_sessions: Optional[int] = None      # Total sessions for the agent
    pending_evaluations: Optional[int] = None  # Sessions needing evaluation (total - evaluated_sessions)

    class Config:
        from_attributes = True


# Compliance Evaluation Schemas
class ViolationDetail(BaseModel):
    message_index: Optional[int] = None
    message_id: Optional[str] = None
    violation_type: str
    description: str
    details: Optional[Dict[str, Any]] = None


class ComplianceEvaluationResponse(BaseModel):
    id: int
    memory_id: str  # File-based ID (filename without extension)
    policy_id: int
    policy_name: Optional[str] = None
    policy_description: Optional[str] = None
    policy_severity: str = 'error'
    is_compliant: bool
    violations: List[Dict[str, Any]]
    compliance_details: Optional[List[Dict[str, Any]]] = None
    evaluated_at: datetime

    class Config:
        from_attributes = True


class EvaluateMemoryRequest(BaseModel):
    memory_id: str  # File-based ID (filename without extension)
    policy_ids: Optional[List[int]] = None  # If None, evaluate against all enabled policies


class ComplianceSummary(BaseModel):
    total_memories: int
    processed_memories: int  # Count of fully processed (evaluated) memories
    total_policies: int
    compliance_by_policy: Dict[int, Dict[str, Any]]  # policy_id -> {name, compliant_count, total_count}
    non_compliant_memories: List[Dict[str, Any]]
    all_memories: List[Dict[str, Any]]  # Only processed memories with compliance status
    llm_usage_totals: Optional[Dict[str, Any]] = None


# Agent Variant Schemas
class AgentVariantSummary(BaseModel):
    """Summary view of an agent variant for list display."""
    id: int
    name: str
    signature: str
    session_count: int
    percentage: float
    tool_count: int
    sequence_preview: str  # First few tools as preview

    class Config:
        from_attributes = True


class AgentVariantDetail(BaseModel):
    """Detailed view of an agent variant including associated memories."""
    id: int
    name: str
    signature: str
    normalized_sequence: List[str]
    sequence_display: str
    memory_ids: List[str]
    session_count: int
    percentage: float
    tool_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class AgentVariantListResponse(BaseModel):
    """Response for listing all agent variants."""
    variants: List[AgentVariantSummary]
    total_sessions: int
    unique_patterns: int


class ToolTransitionResponse(BaseModel):
    """Single tool transition for flow diagram."""
    from_tool: str
    to_tool: str
    count: int


class ToolTransitionsResponse(BaseModel):
    """Response for tool transitions endpoint."""
    transitions: List[ToolTransitionResponse]
    unique_tools: List[str]


# Processing Status Schemas
class ProcessingStatus(BaseModel):
    """Processing status for a session."""
    is_processed: bool
    has_compliance: bool
    has_variants: bool
    policies_evaluated: int
    policies_total: int


class ComplianceStatus(BaseModel):
    """Compliance status for a session (persisted, can be resolved)."""
    status: Optional[str] = None  # null | 'compliant' | 'issues' | 'resolved'
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None


class SessionMetadata(BaseModel):
    """Optional metadata extracted from session JSON files."""
    session_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    user_id: Optional[str] = None
    business_identifiers: Optional[Dict[str, Any]] = None  # order_id, case_id, etc.
    tags: Optional[List[str]] = None
    custom: Optional[Dict[str, Any]] = None  # Any additional metadata


class SessionResponse(BaseModel):
    """Response for a single session with all status info."""
    id: str
    name: str
    uploaded_at: datetime
    message_count: int
    processing_status: ProcessingStatus
    compliance_status: ComplianceStatus
    metadata: Optional[SessionMetadata] = None

    class Config:
        from_attributes = True


class SessionDetailResponse(SessionResponse):
    """Detailed session response including messages."""
    messages: List[Dict[str, Any]]


class ResolveSessionRequest(BaseModel):
    """Request to mark a session as resolved."""
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None


class ProcessBatchRequest(BaseModel):
    """Request to process multiple sessions."""
    memory_ids: List[str]
    refresh_variants: bool = True


class ProcessBatchResponse(BaseModel):
    """Response from batch processing."""
    processed: int
    results: List[Dict[str, Any]]
    variants_refreshed: bool


# Async Processing Job Schemas
class JobStatus(BaseModel):
    """Status of a processing job."""
    id: str
    status: str  # pending | running | completed | failed
    job_type: str
    total_items: int
    completed_items: int
    failed_items: int
    progress_percent: float
    error_message: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobResult(BaseModel):
    """Result details for a completed job."""
    id: str
    status: str
    job_type: str
    total_items: int
    completed_items: int
    failed_items: int
    results: List[Dict[str, Any]]
    error_message: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubmitJobRequest(BaseModel):
    """Request to submit an async processing job."""
    agent_id: str
    memory_ids: List[str]
    policy_ids: Optional[List[int]] = None  # If None, use all enabled policies
    refresh_variants: bool = True


class SubmitJobResponse(BaseModel):
    """Response after submitting a job."""
    job_id: str
    status: str
    total_items: int
    message: str


# Agent Generation Schemas
class CreateAgentRequest(BaseModel):
    """Request to create a new agent with LLM-generated configuration."""
    agent_name: str = Field(..., min_length=1, max_length=100, description="Human-readable agent name")
    description: str = Field(..., min_length=10, description="Natural language description of agent's workflow/use case")
    tools: Optional[str] = Field(None, description="'Auto-generate' or comma-separated tool names")
    business_identifiers: Optional[str] = Field(None, description="Natural language description of business identifiers")
    ensure_tools: Optional[List[str]] = Field(None, description="Tool names that must be included in generated list")
    generate_policies: bool = Field(default=False, description="Whether to generate suggested policies for this agent")
    llm_provider: str = Field(default="openai", description="LLM provider: 'openai' or 'anthropic'")
    model: str = Field(default="gpt-4o", description="Model identifier")


class ToolDefinition(BaseModel):
    """Tool definition including payload hints."""
    name: str
    description: str
    inputs: Dict[str, Any] = Field(default_factory=dict, description="Input payload schema/fields")
    outputs: Dict[str, Any] = Field(default_factory=dict, description="Output payload schema/fields")


class AgentConfigResponse(BaseModel):
    """LLM-generated agent configuration."""
    use_case: str = Field(..., description="Structured description of agent's purpose")
    tools: List[ToolDefinition] = Field(..., description="List of tool objects with name/description and IO schemas")
    business_identifiers: Dict[str, str] = Field(..., description="Business identifier fields and descriptions")


class CreateAgentResponse(BaseModel):
    """Response after creating an agent."""
    agent_id: str = Field(..., description="Unique agent identifier (sanitized from agent_name)")
    agent_name: str = Field(..., description="Human-readable agent name")
    path: str = Field(..., description="Filesystem path to agent directory")
    config: AgentConfigResponse = Field(..., description="LLM-generated agent configuration")
    policies_created: int = Field(default=0, description="Number of policies generated (if generate_policies was True)")


class GenerateSessionsRequest(BaseModel):
    """Request to generate simulated sessions for an agent."""
    num_sessions: int = Field(..., ge=1, le=100, description="Number of sessions to generate (1-100)")
    scenario_variations: Optional[str] = Field(None, description="Comma-separated scenario descriptions")
    session_time_definition: Optional[str] = Field(
        None,
        description="Optional time window or schedule to place sessions (e.g., 'randomly between Monday-Friday, 08:00-17:00 UTC')"
    )
    include_edge_cases: bool = Field(default=True, description="Include error scenarios and edge cases")
    llm_provider: Optional[str] = Field(None, description="Override agent's default LLM provider")
    model: Optional[str] = Field(None, description="Override agent's default model")
