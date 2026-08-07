from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import threading
import models, schemas, database, auth
from agents.orchestrator import AgentOrchestrator

router = APIRouter(prefix="/api/gateway", tags=["gateway"])

# ── In-memory registry of pause events for running orchestrations ────────────
# Maps project_id -> threading.Event (set = running, cleared = paused)
_pause_events: dict[int, threading.Event] = {}

@router.post("/receive-request", response_model=schemas.IncomingProjectResponse)
def receive_client_request(
    project_payload: schemas.IncomingProjectCreate,
    background_tasks: BackgroundTasks,
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
    
    # Trigger the PM Agent orchestration automatically upon receiving the approved requirements
    background_tasks.add_task(run_orchestrator, new_incoming.id)
    
    return new_incoming

@router.get("/incoming-requests", response_model=List[schemas.IncomingProjectResponse])
def get_incoming_requests(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    requests = db.query(models.IncomingProject).order_by(models.IncomingProject.created_at.desc()).all()
    return requests

def run_orchestrator(project_id: int):
    """Run the agent orchestrator in a background thread with pause support."""
    # Create a pause event (initially set = running)
    pause_event = threading.Event()
    pause_event.set()
    _pause_events[project_id] = pause_event

    # Create a fresh database session for the background task
    db = database.SessionLocal()
    try:
        orchestrator = AgentOrchestrator(db, pause_event=pause_event)
        orchestrator.process_incoming_request(project_id)
    finally:
        db.close()
        # Clean up the event from the registry when done
        _pause_events.pop(project_id, None)

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

@router.post("/incoming-requests/{project_id}/pause")
def pause_project_processing(
    project_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Pause an in-progress AI analysis. The orchestrator will stop at the next checkpoint."""
    project = db.query(models.IncomingProject).filter(models.IncomingProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.agent_status not in ("ANALYZING", "PENDING_ANALYSIS"):
        raise HTTPException(status_code=400, detail="Project is not currently being analyzed")

    # Clear the event if an active orchestrator thread exists
    pause_event = _pause_events.get(project_id)
    if pause_event:
        pause_event.clear()

    # Update the status immediately so the frontend reflects it
    project.agent_status = "PAUSED"
    db.commit()

    print(f"[GATEWAY] Paused processing for project {project_id}")
    return {"message": "Project processing paused", "project_id": project_id}

@router.post("/incoming-requests/{project_id}/resume")
def resume_project_processing(
    project_id: int,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Resume a paused AI analysis."""
    project = db.query(models.IncomingProject).filter(models.IncomingProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.agent_status != "PAUSED":
        raise HTTPException(status_code=400, detail="Project is not currently paused")

    pause_event = _pause_events.get(project_id)
    if pause_event:
        # Active orchestrator thread exists — unblock it
        pause_event.set()
        project.agent_status = "ANALYZING"
        db.commit()
    else:
        # No active thread (e.g. server restarted while paused) — re-trigger orchestrator
        project.agent_status = "ANALYZING"
        db.commit()
        background_tasks.add_task(run_orchestrator, project_id)
        print(f"[GATEWAY] No active thread found — re-launching orchestrator for project {project_id}")

    print(f"[GATEWAY] Resumed processing for project {project_id}")
    return {"message": "Project processing resumed", "project_id": project_id}

@router.get("/agent-messages/{client_project_id}", response_model=List[schemas.AgentChatMessageResponse])
def get_agent_messages(
    client_project_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Fetch all live agent delegation messages for a given client_project_id (for the chat UI)."""
    messages = (
        db.query(models.AgentChatMessage)
        .filter(models.AgentChatMessage.client_project_id == client_project_id)
        .order_by(models.AgentChatMessage.created_at.asc())
        .all()
    )
    return messages

@router.post("/incoming-requests-by-client/{client_project_id}/approve")
def approve_incoming_request_by_client(
    client_project_id: int,
    db: Session = Depends(database.get_db)
):
    project = db.query(models.IncomingProject).filter(
        models.IncomingProject.client_project_id == client_project_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.agent_status = "APPROVED"
    db.commit()
    
    # Save chat messages in the company network agent log showing the A2A communication
    from agents.orchestrator import _save_message
    _save_message(db, project, "Client Agent", "client", "client ok with this report")
    _save_message(db, project, "PM Agent", "pm", "🎉 The proposal has been officially approved. Initiating project onboarding.")
        
    print(f"[GATEWAY] Client Project {client_project_id} proposal APPROVED by client")
    return {"message": "Project status updated to APPROVED"}

@router.post("/incoming-requests-by-client/{client_project_id}/reject")
def reject_incoming_request_by_client(
    client_project_id: int,
    db: Session = Depends(database.get_db)
):
    project = db.query(models.IncomingProject).filter(
        models.IncomingProject.client_project_id == client_project_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.agent_status = "REJECTED"
    db.commit()
    
    # Save chat messages in the company network agent log showing the A2A communication
    from agents.orchestrator import _save_message
    _save_message(db, project, "Client Agent", "client", "client not okay with this report")
    _save_message(db, project, "PM Agent", "pm", "Understood. Re-opening proposal review. Please clarify the changes requested.")
        
    print(f"[GATEWAY] Client Project {client_project_id} proposal REJECTED by client")
    return {"message": "Project status updated to REJECTED"}
