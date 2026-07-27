from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, auth
from agents.orchestrator import AgentOrchestrator

router = APIRouter(prefix="/api/gateway", tags=["gateway"])

@router.post("/receive-request", response_model=schemas.IncomingProjectResponse)
def receive_client_request(
    project_payload: schemas.IncomingProjectCreate,
    db: Session = Depends(database.get_db)
):
    # Log the incoming request (simulating network entry point)
    print(f"[*] Received cross-network payload from client project ID: {project_payload.client_project_id}")

    # Check if this project was already transmitted (idempotency check)
    existing_project = db.query(models.IncomingProject).filter(
        models.IncomingProject.client_project_id == project_payload.client_project_id
    ).first()
    
    if existing_project:
        # If it exists, we update it
        update_data = project_payload.model_dump()
        db.query(models.IncomingProject).filter(
            models.IncomingProject.client_project_id == project_payload.client_project_id
        ).update(update_data)
        db.commit()
        db.refresh(existing_project)
        print(f"[*] Updated existing incoming project {existing_project.id}")
        return existing_project
    
    # Otherwise, create a new record
    new_incoming = models.IncomingProject(**project_payload.model_dump())
    db.add(new_incoming)
    db.commit()
    db.refresh(new_incoming)
    
    print(f"[*] Stored new incoming project {new_incoming.id}. Ready for PM Agent Analysis.")
    
    
    # In a full implementation, this is where we trigger the Project Manager Agent
    return new_incoming

@router.get("/incoming-requests", response_model=List[schemas.IncomingProjectResponse])
def get_incoming_requests(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    requests = db.query(models.IncomingProject).order_by(models.IncomingProject.created_at.desc()).all()
    return requests

def run_orchestrator(project_id: int):
    # Create a fresh database session for the background task
    db = database.SessionLocal()
    try:
        orchestrator = AgentOrchestrator(db)
        orchestrator.process_incoming_request(project_id)
    finally:
        db.close()

@router.post("/incoming-requests/{project_id}/assign-ai")
def assign_ai_to_request(
    project_id: int,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Verify project exists
    project = db.query(models.IncomingProject).filter(models.IncomingProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project.agent_status != "PENDING_ANALYSIS":
        raise HTTPException(status_code=400, detail="Project is already being analyzed or has a proposal")
        
    # Trigger background task
    background_tasks.add_task(run_orchestrator, project_id)
    
    return {"message": "Agent orchestration started", "project_id": project_id}
