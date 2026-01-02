from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
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


# Policy Schemas
class PolicyConfig(BaseModel):
    pass


class ResponseLengthPolicyConfig(PolicyConfig):
    max_tokens: int


class ToolCallPolicyConfig(PolicyConfig):
    tool_name: str
    parameters: Optional[Dict[str, Any]] = None


class ToolResponsePolicyConfig(PolicyConfig):
    tool_name: str
    expect_success: bool = True


class CompoundToolPolicyConfig(PolicyConfig):
    conditions: List[Dict[str, Any]]  # List of tool conditions to check


class LLMEvalPolicyConfig(PolicyConfig):
    evaluation_prompt: str
    message_filter: Optional[Dict[str, Any]] = None  # Filter to select messages
    llm_provider: str = "anthropic"  # anthropic or openai
    model: str = "claude-sonnet-4-5-20250929"


class PolicyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    policy_type: str  # response_length, tool_call, tool_response, compound_tool, llm_eval
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
    memory_ids: List[str]
    policy_ids: Optional[List[int]] = None  # If None, use all enabled policies
    refresh_variants: bool = True


class SubmitJobResponse(BaseModel):
    """Response after submitting a job."""
    job_id: str
    status: str
    total_items: int
    message: str
