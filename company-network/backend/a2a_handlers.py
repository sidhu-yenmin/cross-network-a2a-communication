import asyncio
import json
from database import SessionLocal
import models
from agents.orchestrator import AgentOrchestrator, _save_message
import threading

def run_orchestrator_sync(project_id: int):
    # This function should be run in a separate thread so it doesn't block
    db = SessionLocal()
    try:
        pause_event = threading.Event()
        pause_event.set()
        
        # In a full implementation, we'd add it to the gateway._pause_events map, 
        # but for simplicity we will just run it
        orchestrator = AgentOrchestrator(db, pause_event=pause_event)
        orchestrator.process_incoming_request(project_id)
    finally:
        db.close()

async def handle_incoming_a2a_message(message: dict):
    message_type = message.get("message_type")
    
    if message_type == "REQUIREMENT_SUBMISSION":
        payload = message.get("payload", {})
        client_project_id = payload.get("client_project_id")
        reproposal = payload.get("reproposal", False)
        
        db = SessionLocal()
        try:
            existing_project = db.query(models.IncomingProject).filter(
                models.IncomingProject.client_project_id == client_project_id
            ).first()
            
            project_id_to_run = None
            if existing_project:
                # Update existing
                for key, value in payload.items():
                    if key != "reproposal" and hasattr(existing_project, key):
                        setattr(existing_project, key, value)
                
                if reproposal:
                    existing_project.agent_status = "ANALYZING"
                    existing_project.proposal_data = None
                    db.commit()
                    
                    summary_text = (
                        f"📋 **Updated Re-proposal Requirements Summary**\n"
                        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                        f"🔹 Project Name     : {payload.get('name')}\n"
                        f"🔹 Description      : {payload.get('description')}\n"
                        f"🔹 Target Platforms : {payload.get('target_platforms')}\n"
                        f"🔹 Target Audience  : {payload.get('target_audience')}\n"
                        f"🔹 Timeline         : {payload.get('expected_timeline')}\n"
                        f"🔹 Budget Range     : {payload.get('budget_range')}\n"
                        f"🔹 Key Features     : {payload.get('key_features')}\n"
                        f"🔹 Existing Systems : {payload.get('existing_systems')}\n"
                        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    )
                    
                    _save_message(db, existing_project, "Client Agent", "client", summary_text)
                    _save_message(db, existing_project, "PM Agent", "pm", "🔄 Received re-proposal request with modified requirements. Automatically re-running the AI analysis pipeline.")
                else:
                    existing_project.agent_status = "PENDING_ANALYSIS"
                    existing_project.proposal_data = None
                    db.commit()
                project_id_to_run = existing_project.id
            else:
                # Create new
                incoming_data = {k: v for k, v in payload.items() if k != "reproposal" and hasattr(models.IncomingProject, k)}
                new_incoming = models.IncomingProject(**incoming_data)
                db.add(new_incoming)
                db.commit()
                db.refresh(new_incoming)
                project_id_to_run = new_incoming.id
                
            if project_id_to_run:
                print(f"[COMPANY A2A] Starting orchestrator for project {project_id_to_run}")
                # Run orchestrator in thread
                threading.Thread(target=run_orchestrator_sync, args=(project_id_to_run,)).start()
        finally:
            db.close()
            
    elif message_type == "PROPOSAL_APPROVAL":
        client_project_id = message.get("client_project_id")
        db = SessionLocal()
        try:
            project = db.query(models.IncomingProject).filter(
                models.IncomingProject.client_project_id == client_project_id
            ).first()
            if project:
                project.agent_status = "PENDING_MANAGEMENT_APPROVAL"
                db.commit()
                _save_message(db, project, "Client Agent", "client", "client ok with this report")
                _save_message(db, project, "PM Agent", "pm", "Client is okay with the estimation. If you are okay with it, please click Approve, or click Reject. Alternatively, you can type ok or approve in the chat to approve.")
                print(f"[COMPANY A2A] Client Project {client_project_id} proposal APPROVED by client.")
        finally:
            db.close()
            
    elif message_type == "PROPOSAL_REJECTION":
        client_project_id = message.get("client_project_id")
        db = SessionLocal()
        try:
            project = db.query(models.IncomingProject).filter(
                models.IncomingProject.client_project_id == client_project_id
            ).first()
            if project:
                project.agent_status = "REJECTED"
                db.commit()
                _save_message(db, project, "Client Agent", "client", "client not okay with this report")
                _save_message(db, project, "PM Agent", "pm", "Understood. Re-opening proposal review. Please clarify the changes requested.")
                print(f"[COMPANY A2A] Client Project {client_project_id} proposal REJECTED by client.")
        finally:
            db.close()
            
    elif message_type == "REPROPOSAL_REQUEST":
        client_project_id = message.get("client_project_id")
        db = SessionLocal()
        try:
            project = db.query(models.IncomingProject).filter(
                models.IncomingProject.client_project_id == client_project_id
            ).first()
            if project:
                project.agent_status = "PENDING_ANALYSIS"
                db.commit()
                _save_message(db, project, "Client Agent", "client", "client requested modifications and re-proposal")
                _save_message(db, project, "PM Agent", "pm", "Re-proposal requested. Waiting for updated requirements from Client Agent.")
                print(f"[COMPANY A2A] Client Project {client_project_id} re-proposal requested by client.")
        finally:
            db.close()
