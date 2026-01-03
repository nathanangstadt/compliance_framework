"""
Agent routes for multi-agent support.

Provides endpoints to list available agents and get agent details.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import shutil
from pathlib import Path

from app.database import get_db
from app.models import Policy, ComplianceEvaluation, AgentVariant, ToolTransition, SessionStatus
from app.services.memory_loader import memory_loader

router = APIRouter(prefix="/api/agents", tags=["agents"])


class AgentResponse(BaseModel):
    id: str
    name: str
    session_count: int
    path: str


@router.get("/", response_model=List[AgentResponse])
def list_agents():
    """
    List all available agents.

    Returns agents discovered from subdirectories in agent_data/.
    """
    agents = memory_loader.list_agents()
    return agents


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

    return agent


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
