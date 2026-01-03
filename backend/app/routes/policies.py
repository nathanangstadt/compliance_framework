from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Policy
from app.schemas import PolicyCreate, PolicyUpdate, PolicyResponse

router = APIRouter(prefix="/api/policies", tags=["policies"])


@router.post("/{agent_id}/", response_model=PolicyResponse)
async def create_policy(agent_id: str, policy: PolicyCreate, db: Session = Depends(get_db)):
    """Create a new policy."""
    db_policy = Policy(
        agent_id=agent_id,
        name=policy.name,
        description=policy.description,
        policy_type=policy.policy_type,
        config=policy.config,
        enabled=policy.enabled,
        severity=policy.severity,
        _nocode_nodes=policy._nocode_nodes
    )
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy


@router.get("/{agent_id}/", response_model=List[PolicyResponse])
async def list_policies(agent_id: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all policies for a specific agent."""
    policies = db.query(Policy).filter(Policy.agent_id == agent_id).offset(skip).limit(limit).all()
    return policies


@router.get("/{agent_id}/{policy_id}", response_model=PolicyResponse)
async def get_policy(agent_id: str, policy_id: int, db: Session = Depends(get_db)):
    """Get a specific policy."""
    policy = db.query(Policy).filter(
        Policy.id == policy_id,
        Policy.agent_id == agent_id
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


@router.put("/{agent_id}/{policy_id}", response_model=PolicyResponse)
async def update_policy(agent_id: str, policy_id: int, policy: PolicyUpdate, db: Session = Depends(get_db)):
    """Update a policy."""
    db_policy = db.query(Policy).filter(
        Policy.id == policy_id,
        Policy.agent_id == agent_id
    ).first()
    if not db_policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    if policy.name is not None:
        db_policy.name = policy.name
    if policy.description is not None:
        db_policy.description = policy.description
    if policy.config is not None:
        db_policy.config = policy.config
    if policy.enabled is not None:
        db_policy.enabled = policy.enabled
    if policy.severity is not None:
        db_policy.severity = policy.severity
    if policy._nocode_nodes is not None:
        db_policy._nocode_nodes = policy._nocode_nodes

    db.commit()
    db.refresh(db_policy)
    return db_policy


@router.delete("/{agent_id}/{policy_id}")
async def delete_policy(agent_id: str, policy_id: int, db: Session = Depends(get_db)):
    """Delete a policy."""
    policy = db.query(Policy).filter(
        Policy.id == policy_id,
        Policy.agent_id == agent_id
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    db.delete(policy)
    db.commit()
    return {"message": "Policy deleted successfully"}
