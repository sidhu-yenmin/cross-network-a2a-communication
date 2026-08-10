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
        update_data = project_payload.model_dump(exclude={"reproposal"})
        db.query(models.IncomingProject).filter(
            models.IncomingProject.client_project_id == project_payload.client_project_id
        ).update(update_data)
        
        if project_payload.reproposal:
            # Re-proposal request — automatically trigger PM orchestrator and log the detailed SRS summary
            existing_project.agent_status = "ANALYZING"
            existing_project.proposal_data = None
            db.commit()
            db.refresh(existing_project)
            
            # Format and log the detailed requirements summary from Client Agent to PM Agent
            summary_text = (
                f"📋 **Updated Re-proposal Requirements Summary**\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                f"🔹 Project Name     : {project_payload.name}\n"
                f"🔹 Description      : {project_payload.description}\n"
                f"🔹 Target Platforms : {project_payload.target_platforms}\n"
                f"🔹 Target Audience  : {project_payload.target_audience}\n"
                f"🔹 Timeline         : {project_payload.expected_timeline}\n"
                f"🔹 Budget Range     : {project_payload.budget_range}\n"
                f"🔹 Key Features     : {project_payload.key_features}\n"
                f"🔹 Existing Systems : {project_payload.existing_systems}\n"
                f" \n"
                f"[Technical Approach]: {project_payload.tech_approach}\n"
                f"[Frontend Tech]     : {project_payload.tech_frontend}\n"
                f"[Backend Tech]      : {project_payload.tech_backend}\n"
                f"[Database Tech]     : {project_payload.tech_database}\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            )
            
            from agents.orchestrator import _save_message
            _save_message(db, existing_project, "Client Agent", "client", summary_text)
            _save_message(db, existing_project, "PM Agent", "pm", "🔄 Received re-proposal request with modified requirements. Automatically re-running the AI analysis pipeline.")
            print(f"[*] Updated existing incoming project {existing_project.id} with re-proposal modifications. Re-running orchestration.")
            
            # Re-trigger orchestration automatically!
            background_tasks.add_task(run_orchestrator, existing_project.id)
        else:
            # Reset the status so that the orchestrator knows it is starting a fresh analysis
            existing_project.agent_status = "PENDING_ANALYSIS"
            existing_project.proposal_data = None
            db.commit()
            db.refresh(existing_project)
            print(f"[*] Updated existing incoming project {existing_project.id} with modified requirements.")
            
            # Re-trigger orchestration automatically!
            background_tasks.add_task(run_orchestrator, existing_project.id)
            
        return existing_project
    
    # Otherwise, create a new record
    new_incoming = models.IncomingProject(**project_payload.model_dump(exclude={"reproposal"}))
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

@router.get("/incoming-requests/by-client/{client_project_id}", response_model=schemas.IncomingProjectResponse)
def get_incoming_request_by_client(
    client_project_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    project = db.query(models.IncomingProject).filter(
        models.IncomingProject.client_project_id == client_project_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

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

    project.agent_status = "PENDING_MANAGEMENT_APPROVAL"
    db.commit()
    
    # Save chat messages in the company network agent log showing the A2A communication
    from agents.orchestrator import _save_message
    _save_message(db, project, "Client Agent", "client", "client ok with this report")
    _save_message(db, project, "PM Agent", "pm", "Client is okay with the estimation. If you are okay with it, please click Approve, or click Reject. Alternatively, you can type ok or approve in the chat to approve.")
        
    print(f"[GATEWAY] Client Project {client_project_id} proposal APPROVED by client, waiting for manual management approval.")
    return {"message": "Project status updated to PENDING_MANAGEMENT_APPROVAL"}

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

@router.post("/incoming-requests-by-client/{client_project_id}/reproposal")
def reproposal_incoming_request_by_client(
    client_project_id: int,
    db: Session = Depends(database.get_db)
):
    project = db.query(models.IncomingProject).filter(
        models.IncomingProject.client_project_id == client_project_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.agent_status = "PENDING_ANALYSIS"
    db.commit()
    
    # Save chat messages in the company network agent log showing the A2A communication
    from agents.orchestrator import _save_message
    _save_message(db, project, "Client Agent", "client", "client requested modifications and re-proposal")
    _save_message(db, project, "PM Agent", "pm", "Re-proposal requested. Waiting for updated requirements from Client Agent.")
        
    print(f"[GATEWAY] Client Project {client_project_id} re-proposal requested by client")
    return {"message": "Project status updated to PENDING_ANALYSIS for re-proposal"}

@router.post("/incoming-requests/{project_id}/approve-reproposal")
def approve_reproposal(
    project_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
    project = db.query(models.IncomingProject).filter(models.IncomingProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.agent_status = "ANALYZING"
    project.proposal_data = None
    db.commit()

    from agents.orchestrator import _save_message
    _save_message(db, project, "PM Agent", "pm", "Approved the modified requirements. Re-running the AI analysis pipeline.")

    background_tasks.add_task(run_orchestrator, project_id)
    return {"message": "Re-proposal requirements approved. Analysis started."}

@router.post("/incoming-requests/{project_id}/reject-reproposal")
def reject_reproposal(
    project_id: int,
    db: Session = Depends(database.get_db)
):
    project = db.query(models.IncomingProject).filter(models.IncomingProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.agent_status = "REJECTED"
    db.commit()

    from agents.orchestrator import _save_message
    _save_message(db, project, "PM Agent", "pm", "Rejected the modified requirements. Notifying the Client Agent.")

    # Call Client Network reject-reproposal-sync endpoint
    try:
        import urllib.request
        url = f"http://localhost:8001/api/projects/{project.client_project_id}/reject-reproposal-sync"
        req = urllib.request.Request(url, method="POST")
        with urllib.request.urlopen(req) as resp:
            print(f"[GATEWAY] Synced re-proposal rejection to Client Network. Code: {resp.status}")
    except Exception as e:
        print(f"[GATEWAY] Failed to sync re-proposal rejection to Client Network: {e}")

    return {"message": "Re-proposal requirements rejected."}

def sync_approved_to_client(client_project_id: int):
    try:
        import urllib.request
        url = f"http://localhost:8001/api/projects/{client_project_id}/management-approved-sync"
        req = urllib.request.Request(url, method="POST")
        with urllib.request.urlopen(req) as resp:
            print(f"[GATEWAY] Synced management approval to Client Network. Code: {resp.status}")
    except Exception as e:
        print(f"[GATEWAY] Failed to sync management approval to Client Network: {e}")

def sync_rejected_to_client(client_project_id: int):
    try:
        import urllib.request
        url = f"http://localhost:8001/api/projects/{client_project_id}/management-rejected-sync"
        req = urllib.request.Request(url, method="POST")
        with urllib.request.urlopen(req) as resp:
            print(f"[GATEWAY] Synced management rejection to Client Network. Code: {resp.status}")
    except Exception as e:
        print(f"[GATEWAY] Failed to sync management rejection to Client Network: {e}")

@router.post("/incoming-requests/{project_id}/management-approve")
def management_approve_project(
    project_id: int,
    db: Session = Depends(database.get_db)
):
    project = db.query(models.IncomingProject).filter(models.IncomingProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.agent_status = "APPROVED"
    db.commit()

    from agents.orchestrator import _save_message
    _save_message(db, project, "PM Agent", "pm", "🎉 The proposal has been officially approved by management. Initiating project onboarding.")

    sync_approved_to_client(project.client_project_id)
    return {"message": "Project approved by management"}

@router.post("/incoming-requests/{project_id}/management-reject")
def management_reject_project(
    project_id: int,
    db: Session = Depends(database.get_db)
):
    project = db.query(models.IncomingProject).filter(models.IncomingProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.agent_status = "REJECTED"
    db.commit()

    from agents.orchestrator import _save_message
    _save_message(db, project, "PM Agent", "pm", "❌ The proposal has been rejected by management.")

    sync_rejected_to_client(project.client_project_id)
    return {"message": "Project rejected by management"}

class MessagePayload(schemas.BaseModel):
    message: str

@router.post("/incoming-requests/{project_id}/send-message")
def send_agent_message_from_company(
    project_id: int,
    payload: MessagePayload,
    db: Session = Depends(database.get_db)
):
    project = db.query(models.IncomingProject).filter(models.IncomingProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    from agents.orchestrator import _save_message
    # Save the user's message as coming from "PM Agent"
    _save_message(db, project, "PM Agent", "pm", payload.message)

    # Check if the message is "ok" or "approve" manually typed in chat
    msg_lower = payload.message.strip().lower().strip("!.,")
    if msg_lower in ["ok", "approve", "approved", "yes", "confirm", "proceed", "go ahead"]:
        if project.agent_status == "PENDING_MANAGEMENT_APPROVAL":
            project.agent_status = "APPROVED"
            db.commit()
            _save_message(db, project, "PM Agent", "pm", "🎉 The proposal has been officially approved by management. Initiating project onboarding.")
            sync_approved_to_client(project.client_project_id)

    return {"message": "Message saved successfully"}
