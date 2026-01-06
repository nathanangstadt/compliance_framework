"""
Agent routes for multi-agent support.

Provides endpoints to list available agents and get agent details.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import shutil
import json
import threading
import time
import uuid
from pathlib import Path
from datetime import datetime

from app.database import get_db
from app.models import Policy, ComplianceEvaluation, AgentVariant, ToolTransition, SessionStatus, ProcessingJob
from app.services.memory_loader import memory_loader
from app.services.agent_generator import AgentGenerator
from app.schemas import (
    CreateAgentRequest,
    CreateAgentResponse,
    AgentConfigResponse,
    GenerateSessionsRequest,
    SubmitJobResponse
)
from app.routes.jobs import update_job_status

router = APIRouter(prefix="/api/agents", tags=["agents"])


class AgentResponse(BaseModel):
    id: str
    name: str
    session_count: int
    path: str
    description: str | None = None
    use_case: str | None = None
    llm_provider: str | None = None
    llm_model: str | None = None
    tools: Optional[list] = None


def _load_agent_metadata(agent_id: str):
    """Load agent metadata from .agent_metadata.json if present."""
    agent_dir = Path(memory_loader.base_dir) / agent_id
    metadata_file = agent_dir / ".agent_metadata.json"
    if not metadata_file.exists():
        return {}
    try:
        with open(metadata_file, "r") as f:
            data = json.load(f)
        llm_config = data.get("llm_config", {}) if isinstance(data, dict) else {}
        return {
            "description": data.get("description"),
            "use_case": data.get("use_case"),
            "llm_provider": llm_config.get("provider"),
            "llm_model": llm_config.get("model"),
            "tools": data.get("tools"),
        }
    except Exception:
        return {}


@router.get("/", response_model=List[AgentResponse])
def list_agents():
    """
    List all available agents.

    Returns agents discovered from subdirectories in agent_data/.
    """
    agents = memory_loader.list_agents()
    enriched = []
    for agent in agents:
        meta = _load_agent_metadata(agent["id"])
        enriched.append({**agent, **meta})
    return enriched


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str):
    """
    Get details for a specific agent.

    Args:
        agent_id: The agent identifier

    Returns:
        Agent details including session count
    """
    agents = memory_loader.list_agents()
    agent = next((a for a in agents if a["id"] == agent_id), None)

    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")

    # Enrich with metadata
    meta = _load_agent_metadata(agent_id)
    return {**agent, **meta}


@router.delete("/{agent_id}")
def delete_agent(agent_id: str, db: Session = Depends(get_db)):
    """
    Delete an agent and all associated data.

    This will:
    1. Delete all database records (policies, evaluations, variants, transitions, session statuses)
    2. Delete all session files from the filesystem
    3. Remove the agent directory

    Args:
        agent_id: The agent identifier

    Returns:
        Summary of deleted items
    """
    # Verify agent exists
    agents = memory_loader.list_agents()
    agent = next((a for a in agents if a["id"] == agent_id), None)

    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")

    # Delete database records
    policies_deleted = db.query(Policy).filter(Policy.agent_id == agent_id).delete()
    evaluations_deleted = db.query(ComplianceEvaluation).filter(ComplianceEvaluation.agent_id == agent_id).delete()
    transitions_deleted = db.query(ToolTransition).filter(ToolTransition.agent_id == agent_id).delete()
    variants_deleted = db.query(AgentVariant).filter(AgentVariant.agent_id == agent_id).delete()
    sessions_deleted = db.query(SessionStatus).filter(SessionStatus.agent_id == agent_id).delete()
    db.commit()

    # Delete filesystem directory
    agent_path = Path(agent["path"])
    files_deleted = 0
    if agent_path.exists():
        files_deleted = len(list(agent_path.glob("*.json")))
        shutil.rmtree(agent_path)

    return {
        "message": f"Agent '{agent_id}' deleted successfully",
        "agent_id": agent_id,
        "policies_deleted": policies_deleted,
        "evaluations_deleted": evaluations_deleted,
        "variants_deleted": variants_deleted,
        "transitions_deleted": transitions_deleted,
        "session_statuses_deleted": sessions_deleted,
        "session_files_deleted": files_deleted,
        "directory_removed": str(agent_path)
    }


@router.post("/", response_model=CreateAgentResponse)
def create_agent(request: CreateAgentRequest):
    """
    Create a new agent with LLM-generated configuration.

    Uses LLM to:
    1. Parse natural language description into structured use case
    2. Generate appropriate tool list (or use provided tools)
    3. Define business identifier schema

    Creates agent_data subdirectory and saves metadata.

    Args:
        request: CreateAgentRequest with agent details and LLM config

    Returns:
        CreateAgentResponse with agent_id, path, and generated config

    Raises:
        HTTPException 400: If agent already exists or validation fails
        HTTPException 500: If LLM generation or filesystem operations fail
    """
    # Sanitize agent_id (no spaces, lowercase, alphanumeric + underscore)
    agent_id = request.agent_name.lower().replace(" ", "_")
    agent_id = "".join(c for c in agent_id if c.isalnum() or c == "_")

    if not agent_id:
        raise HTTPException(status_code=400, detail="Agent name must contain at least one alphanumeric character")

    # Check if agent already exists
    agents = memory_loader.list_agents()
    if any(a["id"] == agent_id for a in agents):
        raise HTTPException(status_code=400, detail=f"Agent '{agent_id}' already exists")

    # Use LLM to generate agent configuration
    generator = AgentGenerator(
        llm_provider=request.llm_provider,
        model=request.model
    )

    try:
        agent_config = generator.generate_agent_config(
            agent_name=request.agent_name,
            description=request.description,
            tools_input=request.tools,
            business_identifiers_desc=request.business_identifiers,
            ensure_tools=request.ensure_tools
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate agent config: {str(e)}")

    # Create agent directory
    agent_dir = Path(memory_loader.base_dir) / agent_id

    try:
        agent_dir.mkdir(parents=True, exist_ok=False)
    except FileExistsError:
        raise HTTPException(status_code=400, detail=f"Agent directory already exists at {agent_dir}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create agent directory: {str(e)}")

    # Save agent metadata
    metadata_file = agent_dir / ".agent_metadata.json"
    metadata = {
        "agent_id": agent_id,
        "agent_name": request.agent_name,
        "description": request.description,
        "use_case": agent_config["use_case"],
        "tools": agent_config["tools"],
        "business_identifiers": agent_config["business_identifiers"],
        "llm_config": {
            "provider": request.llm_provider,
            "model": request.model
        },
        "created_at": datetime.utcnow().isoformat()
    }

    try:
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
    except Exception as e:
        # Clean up directory if metadata save fails
        shutil.rmtree(agent_dir)
        raise HTTPException(status_code=500, detail=f"Failed to save agent metadata: {str(e)}")

    # Generate policies if requested
    policies_created = 0
    if request.generate_policies:
        try:
            # Generate policy suggestions
            policy_suggestions = generator.generate_policy_suggestions(metadata)

            # Save policies to database
            from app.database import SessionLocal
            db = SessionLocal()
            try:
                # Map LLM severity to database severity
                severity_map = {
                    "high": "error",
                    "medium": "warning",
                    "low": "info"
                }

                for policy_data in policy_suggestions:
                    llm_severity = policy_data.get("severity", "medium")
                    db_severity = severity_map.get(llm_severity, "error")

                    policy = Policy(
                        agent_id=agent_id,
                        name=policy_data["policy_name"],
                        description=policy_data.get("description", ""),
                        policy_type=policy_data["policy_type"],
                        config=policy_data["config"],
                        severity=db_severity,
                        enabled=policy_data.get("enabled", True)
                    )
                    db.add(policy)
                    policies_created += 1

                db.commit()
            finally:
                db.close()
        except Exception as e:
            # Log error but don't fail agent creation
            print(f"Warning: Failed to generate policies for agent {agent_id}: {str(e)}")

    return CreateAgentResponse(
        agent_id=agent_id,
        agent_name=request.agent_name,
        path=str(agent_dir),
        config=AgentConfigResponse(**agent_config),
        policies_created=policies_created
    )


@router.post("/{agent_id}/generate-sessions", response_model=SubmitJobResponse)
def generate_sessions(
    agent_id: str,
    request: GenerateSessionsRequest,
    db: Session = Depends(get_db)
):
    """
    Submit async job to generate simulated sessions for an agent.

    Uses LLM to create realistic multi-turn conversations with:
    - Tool use sequences matching agent's workflow
    - Varied scenarios and edge cases
    - Realistic business identifiers

    Args:
        agent_id: The agent identifier
        request: GenerateSessionsRequest with session parameters
        db: Database session

    Returns:
        SubmitJobResponse with job_id for tracking progress

    Raises:
        HTTPException 404: If agent not found
        HTTPException 400: If agent metadata not found (only API-created agents supported)
    """
    # Validate agent exists
    agents = memory_loader.list_agents()
    agent = next((a for a in agents if a["id"] == agent_id), None)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")

    # Load agent metadata
    agent_dir = Path(agent["path"])
    metadata_file = agent_dir / ".agent_metadata.json"

    if not metadata_file.exists():
        raise HTTPException(
            status_code=400,
            detail="Agent metadata not found. Only agents created via API can generate sessions."
        )

    try:
        with open(metadata_file, 'r') as f:
            agent_metadata = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load agent metadata: {str(e)}")

    # Create job record
    job_id = str(uuid.uuid4())
    job = ProcessingJob(
        id=job_id,
        agent_id=agent_id,
        status='pending',
        job_type='generate_sessions',
        total_items=request.num_sessions,
        completed_items=0,
        failed_items=0,
        input_data={
            'agent_id': agent_id,
            'agent_metadata': agent_metadata,
            'num_sessions': request.num_sessions,
            'scenario_variations': request.scenario_variations,
            'include_edge_cases': request.include_edge_cases,
            'llm_provider': request.llm_provider or agent_metadata['llm_config']['provider'],
            'model': request.model or agent_metadata['llm_config']['model']
        },
        results=[]
    )
    db.add(job)
    db.commit()

    # Start background thread
    thread = threading.Thread(
        target=generate_sessions_background,
        args=(job_id, agent_id, agent_metadata, request),
        daemon=True
    )
    thread.start()

    return SubmitJobResponse(
        job_id=job_id,
        status='pending',
        total_items=request.num_sessions,
        message=f"Generating {request.num_sessions} simulated sessions for {agent_id}"
    )


def generate_sessions_background(
    job_id: str,
    agent_id: str,
    agent_metadata: dict,
    request: GenerateSessionsRequest
):
    """
    Background task to generate simulated sessions.

    Strategy:
    1. Parse scenario_variations into list of scenario hints
    2. Add edge case scenarios if requested
    3. Generate sessions with varied scenarios
    4. Save each session as JSON file in agent directory
    5. Update job progress after each session

    Args:
        job_id: Job identifier for tracking
        agent_id: Agent identifier
        agent_metadata: Agent metadata dict with tools, business_identifiers, etc.
        request: GenerateSessionsRequest with parameters
    """
    try:
        update_job_status(job_id, status='running', started_at=datetime.utcnow())

        generator = AgentGenerator(
            llm_provider=request.llm_provider or agent_metadata['llm_config']['provider'],
            model=request.model or agent_metadata['llm_config']['model']
        )

        agent_dir = Path(memory_loader.base_dir) / agent_id
        results = []
        failed_count = 0

        # Parse scenario variations
        scenarios = []
        if request.scenario_variations:
            scenarios = [s.strip() for s in request.scenario_variations.split(",")]

        # Add edge case scenarios if requested
        if request.include_edge_cases:
            scenarios.extend([
                "customer not found error",
                "insufficient inventory or resources",
                "payment declined or authorization failed",
                "system timeout or service unavailable",
                "partial success with warnings"
            ])

        # If no scenarios provided, use a default set
        if not scenarios:
            scenarios = ["standard workflow", "high priority request", "complex case with multiple steps"]

        # Start numbering after existing sessions (use numeric prefix before "__" in filenames)
        existing_memories = memory_loader.list_memories(agent_id=agent_id)
        max_existing_num = 0
        for mem in existing_memories:
            try:
                prefix = mem["id"].split("__", 1)[0]
                num = int(prefix)
                if num > max_existing_num:
                    max_existing_num = num
            except (ValueError, AttributeError, KeyError):
                continue

        for i in range(request.num_sessions):
            try:
                # Select scenario hint (cycle through if more sessions than scenarios)
                scenario_hint = scenarios[i % len(scenarios)] if scenarios else None

                session_number = max_existing_num + i + 1

                # Generate session
                session_data = generator.generate_session(
                    agent_metadata=agent_metadata,
                    session_number=session_number,
                    scenario_hint=scenario_hint
                )

                # Generate unique filename
                biz_ids = session_data["metadata"].get("business_identifiers", {})
                # Take first 2 business identifier key-value pairs for filename
                biz_id_parts = []
                for k, v in list(biz_ids.items())[:2]:
                    # Clean value for filename (remove spaces, limit length)
                    clean_val = str(v).replace(" ", "_")[:20]
                    biz_id_parts.append(f"{k}_{clean_val}")

                biz_id_str = "__".join(biz_id_parts) if biz_id_parts else "NO_BIZ_ID"

                # Clean scenario hint for filename
                scenario_clean = scenario_hint.replace(" ", "_")[:30] if scenario_hint else "STANDARD"

                filename = f"{session_number:05d}__{biz_id_str}__{scenario_clean}.json"
                # Ensure filename isn't too long
                if len(filename) > 200:
                    filename = filename[:190] + ".json"

                # Save to file
                session_file = agent_dir / filename
                with open(session_file, 'w') as f:
                    json.dump(session_data, f, indent=2)

                results.append({
                    "session_number": i + 1,
                    "filename": filename,
                    "status": "success",
                    "scenario": scenario_hint
                })

                # Update progress
                update_job_status(
                    job_id,
                    completed_items=i + 1,
                    results=results,
                    failed_items=failed_count
                )

                # Small delay to avoid rate limits
                time.sleep(0.5)

            except Exception as e:
                failed_count += 1
                results.append({
                    "session_number": i + 1,
                    "status": "error",
                    "error": str(e),
                    "scenario": scenario_hint
                })

                update_job_status(
                    job_id,
                    failed_items=failed_count,
                    results=results
                )

        # Complete job
        completion_message = f"Generated {request.num_sessions - failed_count} sessions successfully"
        if failed_count > 0:
            completion_message += f" ({failed_count} failed)"

        update_job_status(
            job_id,
            status='completed',
            completed_at=datetime.utcnow(),
            results=results,
            message=completion_message
        )

    except Exception as e:
        update_job_status(
            job_id,
            status='failed',
            error_message=str(e),
            completed_at=datetime.utcnow()
        )
