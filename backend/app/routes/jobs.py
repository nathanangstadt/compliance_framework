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


def process_job_background(job_id: str, memory_ids: List[str], policy_ids: List[int], refresh_variants: bool):
    """Background task to process compliance evaluations."""
    db = SessionLocal()
    try:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if not job:
            return

        job.status = 'running'
        job.started_at = datetime.utcnow()
        db.commit()

        evaluator = PolicyEvaluator()
        policies = db.query(Policy).filter(Policy.id.in_(policy_ids)).all() if policy_ids else \
                   db.query(Policy).filter(Policy.enabled == True).all()

        results = []
        for idx, memory_id in enumerate(memory_ids):
            try:
                memory = memory_loader.get_memory(memory_id)
                if not memory:
                    results.append({
                        "memory_id": memory_id,
                        "status": "not_found",
                        "error": "Memory not found"
                    })
                    job.failed_items += 1
                else:
                    eval_count = 0
                    for policy in policies:
                        # Delete existing evaluation
                        db.query(ComplianceEvaluation).filter(
                            ComplianceEvaluation.memory_id == memory_id,
                            ComplianceEvaluation.policy_id == policy.id
                        ).delete()

                        # Evaluate
                        config_with_metadata = {
                            **policy.config,
                            'name': policy.name,
                            'description': policy.description
                        }
                        is_compliant, details = evaluator.evaluate(
                            memory["messages"],
                            policy.policy_type,
                            config_with_metadata
                        )

                        # Save evaluation
                        evaluation = ComplianceEvaluation(
                            memory_id=memory_id,
                            policy_id=policy.id,
                            is_compliant=is_compliant,
                            violations=details
                        )
                        db.add(evaluation)
                        eval_count += 1

                    db.commit()
                    results.append({
                        "memory_id": memory_id,
                        "status": "success",
                        "evaluations": eval_count
                    })

                job.completed_items = idx + 1
                job.results = results
                db.commit()

            except Exception as e:
                results.append({
                    "memory_id": memory_id,
                    "status": "error",
                    "error": str(e)
                })
                job.failed_items += 1
                job.results = results
                db.commit()

        # Refresh variants if requested
        if refresh_variants:
            try:
                _compute_and_store_variants(db)
            except Exception as e:
                job.error_message = f"Variants refresh failed: {str(e)}"

        job.status = 'completed'
        job.completed_at = datetime.utcnow()
        job.results = results
        db.commit()

    except Exception as e:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            job.status = 'failed'
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


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
