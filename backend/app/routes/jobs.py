from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
import threading
from datetime import datetime

from app.database import get_db, SessionLocal
from app.models import Policy, ComplianceEvaluation, ProcessingJob
from app.schemas import (
    SubmitJobRequest,
    SubmitJobResponse,
    JobStatus,
    JobResult
)
from app.services.policy_evaluator import PolicyEvaluator
from app.services.memory_loader import memory_loader
from app.routes.agent_variants import _compute_and_store_variants

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def update_job_status(job_id: str, **updates):
    """Update job status with a short-lived DB session."""
    db = SessionLocal()
    try:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            for key, value in updates.items():
                setattr(job, key, value)
            db.commit()
    finally:
        db.close()


def process_job_background(job_id: str, memory_ids: List[str], policy_ids: List[int], refresh_variants: bool):
    """Background task to process compliance evaluations.

    Uses short-lived DB sessions to avoid holding locks during LLM calls.
    """
    try:
        # Mark job as running
        update_job_status(job_id, status='running', started_at=datetime.utcnow())

        # Load policies once (short-lived session)
        db = SessionLocal()
        try:
            policies_data = []
            policies = db.query(Policy).filter(Policy.id.in_(policy_ids)).all() if policy_ids else \
                       db.query(Policy).filter(Policy.enabled == True).all()
            for p in policies:
                policies_data.append({
                    'id': p.id,
                    'name': p.name,
                    'description': p.description,
                    'policy_type': p.policy_type,
                    'config': p.config
                })
        finally:
            db.close()

        evaluator = PolicyEvaluator()
        results = []
        failed_count = 0

        for idx, memory_id in enumerate(memory_ids):
            try:
                # Load memory from file (no DB needed)
                memory = memory_loader.get_memory(memory_id)
                if not memory:
                    results.append({
                        "memory_id": memory_id,
                        "status": "not_found",
                        "error": "Memory not found"
                    })
                    failed_count += 1
                else:
                    evaluations_to_save = []

                    for policy_data in policies_data:
                        # Build config for evaluation
                        config_with_metadata = {
                            **policy_data['config'],
                            'name': policy_data['name'],
                            'description': policy_data['description']
                        }

                        # This is the slow LLM call - NO DB session held here
                        is_compliant, details = evaluator.evaluate(
                            memory["messages"],
                            policy_data['policy_type'],
                            config_with_metadata
                        )

                        evaluations_to_save.append({
                            'memory_id': memory_id,
                            'policy_id': policy_data['id'],
                            'is_compliant': is_compliant,
                            'violations': details
                        })

                    # Now save all evaluations with a short-lived session
                    db = SessionLocal()
                    try:
                        for eval_data in evaluations_to_save:
                            # Delete existing evaluation
                            db.query(ComplianceEvaluation).filter(
                                ComplianceEvaluation.memory_id == eval_data['memory_id'],
                                ComplianceEvaluation.policy_id == eval_data['policy_id']
                            ).delete()

                            # Save new evaluation
                            evaluation = ComplianceEvaluation(
                                memory_id=eval_data['memory_id'],
                                policy_id=eval_data['policy_id'],
                                is_compliant=eval_data['is_compliant'],
                                violations=eval_data['violations']
                            )
                            db.add(evaluation)
                        db.commit()
                    finally:
                        db.close()

                    results.append({
                        "memory_id": memory_id,
                        "status": "success",
                        "evaluations": len(evaluations_to_save)
                    })

                # Update job progress
                update_job_status(job_id, completed_items=idx + 1, results=results, failed_items=failed_count)

            except Exception as e:
                results.append({
                    "memory_id": memory_id,
                    "status": "error",
                    "error": str(e)
                })
                failed_count += 1
                update_job_status(job_id, failed_items=failed_count, results=results)

        # Refresh variants if requested
        error_msg = None
        if refresh_variants:
            db = SessionLocal()
            try:
                _compute_and_store_variants(db)
            except Exception as e:
                error_msg = f"Variants refresh failed: {str(e)}"
            finally:
                db.close()

        # Mark job as completed
        update_job_status(
            job_id,
            status='completed',
            completed_at=datetime.utcnow(),
            results=results,
            error_message=error_msg
        )

    except Exception as e:
        update_job_status(
            job_id,
            status='failed',
            error_message=str(e),
            completed_at=datetime.utcnow()
        )


@router.post("/submit", response_model=SubmitJobResponse)
async def submit_job(
    request: SubmitJobRequest,
    db: Session = Depends(get_db)
):
    """Submit an async processing job for batch evaluation."""
    # Validate memory_ids
    valid_memory_ids = []
    for memory_id in request.memory_ids:
        memory = memory_loader.get_memory(memory_id)
        if memory:
            valid_memory_ids.append(memory_id)

    if not valid_memory_ids:
        raise HTTPException(status_code=400, detail="No valid memory IDs provided")

    # Get policy IDs
    if request.policy_ids:
        policies = db.query(Policy).filter(Policy.id.in_(request.policy_ids)).all()
        policy_ids = [p.id for p in policies]
    else:
        policies = db.query(Policy).filter(Policy.enabled == True).all()
        policy_ids = [p.id for p in policies]

    if not policy_ids:
        raise HTTPException(status_code=400, detail="No policies available for evaluation")

    # Create job record
    job_id = str(uuid.uuid4())
    job = ProcessingJob(
        id=job_id,
        status='pending',
        job_type='batch_evaluate',
        total_items=len(valid_memory_ids),
        completed_items=0,
        failed_items=0,
        input_data={
            'memory_ids': valid_memory_ids,
            'policy_ids': policy_ids,
            'refresh_variants': request.refresh_variants
        },
        results=[]
    )
    db.add(job)
    db.commit()

    # Start background processing in a separate thread (non-blocking)
    thread = threading.Thread(
        target=process_job_background,
        args=(job_id, valid_memory_ids, policy_ids, request.refresh_variants),
        daemon=True
    )
    thread.start()

    return SubmitJobResponse(
        job_id=job_id,
        status='pending',
        total_items=len(valid_memory_ids),
        message=f"Job submitted. Processing {len(valid_memory_ids)} sessions against {len(policy_ids)} policies."
    )


@router.get("/{job_id}/status", response_model=JobStatus)
async def get_job_status(job_id: str, db: Session = Depends(get_db)):
    """Poll for job status."""
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    progress_percent = (job.completed_items / job.total_items * 100) if job.total_items > 0 else 0

    return JobStatus(
        id=job.id,
        status=job.status,
        job_type=job.job_type,
        total_items=job.total_items,
        completed_items=job.completed_items,
        failed_items=job.failed_items,
        progress_percent=round(progress_percent, 1),
        error_message=job.error_message,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at
    )


@router.get("/{job_id}/result", response_model=JobResult)
async def get_job_result(job_id: str, db: Session = Depends(get_db)):
    """Get full job results (typically after completion)."""
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobResult(
        id=job.id,
        status=job.status,
        job_type=job.job_type,
        total_items=job.total_items,
        completed_items=job.completed_items,
        failed_items=job.failed_items,
        results=job.results or [],
        error_message=job.error_message,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at
    )


@router.get("/", response_model=List[JobStatus])
async def list_jobs(
    status: str = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """List recent jobs, optionally filtered by status."""
    query = db.query(ProcessingJob)

    if status:
        query = query.filter(ProcessingJob.status == status)

    jobs = query.order_by(ProcessingJob.created_at.desc()).limit(limit).all()

    results = []
    for job in jobs:
        progress_percent = (job.completed_items / job.total_items * 100) if job.total_items > 0 else 0
        results.append(JobStatus(
            id=job.id,
            status=job.status,
            job_type=job.job_type,
            total_items=job.total_items,
            completed_items=job.completed_items,
            failed_items=job.failed_items,
            progress_percent=round(progress_percent, 1),
            error_message=job.error_message,
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at
        ))

    return results


@router.delete("/{job_id}")
async def delete_job(job_id: str, db: Session = Depends(get_db)):
    """Delete a job record (typically after retrieving results)."""
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status == 'running':
        raise HTTPException(status_code=400, detail="Cannot delete a running job")

    db.delete(job)
    db.commit()

    return {"message": "Job deleted", "job_id": job_id}
