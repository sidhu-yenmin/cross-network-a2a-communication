from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import urllib.request, json
import models, schemas, database, dependencies

router = APIRouter(prefix="/api/projects", tags=["projects"])

def transmit_to_company_network(project: models.Project):
    payload = {
        "client_project_id": project.id,
        "name": project.name,
        "description": project.description,
        "target_platforms": project.target_platforms or "Not specified",
        "target_audience": project.target_audience or "Not specified",
        "expected_timeline": project.expected_timeline or "Not specified",
        "budget_range": project.budget_range or "Not specified",
        "key_features": project.key_features or "Not specified",
        "existing_systems": project.existing_systems or "Not specified"
    }
    try:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            'http://localhost:8000/api/gateway/receive-request', 
            data=data, 
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            print(f"[A2A TRANSMIT] Successfully sent project {project.id} to Company Network. Response: {response.read().decode()}")
    except Exception as e:
        print(f"[A2A TRANSMIT] Failed to transmit project {project.id} to Company Network: {e}")

@router.post("/", response_model=schemas.ProjectResponse)
def create_project(
    project: schemas.ProjectCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(database.get_db)
):
    new_project = models.Project(
        name=project.name,
        description=project.description,
        target_platforms=project.target_platforms,
        target_audience=project.target_audience,
        expected_timeline=project.expected_timeline,
        budget_range=project.budget_range,
        key_features=project.key_features,
        existing_systems=project.existing_systems,
        user_id=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    return new_project

@router.get("/", response_model=List[schemas.ProjectResponse])
def get_projects(
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(database.get_db)
):
    projects = db.query(models.Project).filter(models.Project.user_id == current_user.id).all()
    return projects

@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(
    project_id: int,
    project_update: schemas.ProjectCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(database.get_db)
):
    project_query = db.query(models.Project).filter(
        models.Project.id == project_id, 
        models.Project.user_id == current_user.id
    )
    db_project = project_query.first()
    
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    update_data = project_update.model_dump()
    project_query.update(update_data, synchronize_session=False)
    db.commit()
    
    updated_project = project_query.first()
    
    return updated_project

@router.post("/{project_id}/transmit")
def transmit_project(
    project_id: int,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(database.get_db)
):
    project = db.query(models.Project).filter(
        models.Project.id == project_id, 
        models.Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    background_tasks.add_task(transmit_to_company_network, project)
    return {"message": "Project transmission to Company Network initiated."}

from typing import Optional

@router.get("/chat/history", response_model=List[schemas.ChatMessageResponse])
def get_chat_history(
    project_id: Optional[int] = None,
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Retrieve all chat messages for the current user, optionally filtered by project."""
    query = db.query(models.ChatMessageRecord).filter(
        models.ChatMessageRecord.user_id == current_user.id
    )
    if project_id is not None:
        query = query.filter(models.ChatMessageRecord.project_id == project_id)
    else:
        query = query.filter(models.ChatMessageRecord.project_id == None)
    return query.order_by(models.ChatMessageRecord.timestamp.asc()).all()

@router.get("/chat/history/all", response_model=List[schemas.ChatMessageResponse])
def get_all_chat_history(
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Retrieve ALL chat messages for the current user (across all projects)."""
    return db.query(models.ChatMessageRecord).filter(
        models.ChatMessageRecord.user_id == current_user.id
    ).order_by(models.ChatMessageRecord.timestamp.asc()).all()

@router.post("/chat")
def chat_with_agent(
    chat_request: schemas.ChatRequest,
    project_id: Optional[int] = None,
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(database.get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    project = None
    if project_id:
        project = db.query(models.Project).filter(
            models.Project.id == project_id, 
            models.Project.user_id == current_user.id
        ).first()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    from agents.core.llm_provider import LLMClient
    try:
        # Save the user's message to the database
        user_msg_record = models.ChatMessageRecord(
            user_id=current_user.id,
            project_id=project_id,
            sender="user",
            text=chat_request.message
        )
        db.add(user_msg_record)
        db.commit()

        llm_client = LLMClient()
        # Build history from the database for this project/conversation
        db_history = db.query(models.ChatMessageRecord).filter(
            models.ChatMessageRecord.user_id == current_user.id,
            models.ChatMessageRecord.project_id == project_id
        ).order_by(models.ChatMessageRecord.timestamp.asc()).all()
        history_dicts = [{"sender": m.sender, "text": m.text} for m in db_history]
        
        system_prompt = (
            "You are a strict Project Requirement Assistant. "
            "Your ONLY goal is to interactively chat with the client and gather software project requirements. "
            "Be concise, polite, and ask one clear question at a time to uncover missing details like budget, timeline, target audience, and key features. "
            "Once you have gathered ALL necessary details (project name, description, target platforms, target audience, expected timeline, budget range, key features, and existing systems), "
            "mark the conversation as complete internally. Your reply should be a natural confirmation like 'Thank you! I have all the details I need. Your project requirements are being submitted for review.' "
            "IMPORTANT: NEVER include internal field names, JSON keys, or technical instructions (like 'is_complete', 'set to true', etc.) in your reply to the client. Your reply must always be natural, human-readable text. "
            "ABSOLUTE RULE: Under no circumstances should you answer questions, provide information, or chat about topics unrelated to gathering project requirements. "
            "If the user says anything unrelated (e.g., general knowledge, casual chat, math, code), reply exactly with: 'Please ask queries only related to our project requirement.'"
        )
        
        
        # Get structured response from LLM
        response = llm_client.generate_chat_response(
            message=chat_request.message,
            history=history_dicts,
            system_prompt=system_prompt
        )
        
        reply_text = response.reply
        new_project_id = None
        
        # If the LLM has decided requirements are complete
        if response.is_complete:
            if project:
                # Update existing project
                project.name = response.project_name or project.name
                project.description = response.description or project.description
                project.target_platforms = response.target_platforms or project.target_platforms
                project.target_audience = response.target_audience or project.target_audience
                project.expected_timeline = response.expected_timeline or project.expected_timeline
                project.budget_range = response.budget_range or project.budget_range
                project.key_features = response.key_features or project.key_features
                project.existing_systems = response.existing_systems or project.existing_systems
                project.status = "SUBMITTED"
                db.commit()
                db.refresh(project)
                print(f"[*] Updated existing project {project.id} with extracted requirements.")
            else:
                # Create a new project
                project = models.Project(
                    name=response.project_name or "New Project Request",
                    description=response.description or "Generated from chat",
                    target_platforms=response.target_platforms or "Not specified",
                    target_audience=response.target_audience or "Not specified",
                    expected_timeline=response.expected_timeline or "Not specified",
                    budget_range=response.budget_range or "Not specified",
                    key_features=response.key_features or "Not specified",
                    existing_systems=response.existing_systems or "Not specified",
                    status="SUBMITTED",
                    user_id=current_user.id
                )
                db.add(project)
                db.commit()
                db.refresh(project)
                new_project_id = project.id
                print(f"[*] Created new project {project.id} from chat.")

            # Append transmission notice to reply
            reply_text += "\n\n✅ All project requirements have been gathered successfully. Your project is now being securely transmitted to our Company Network for review and proposal generation. You will be notified once the analysis is complete."
            
            # Trigger A2A background transmission
            background_tasks.add_task(transmit_to_company_network, project)
            
        final_project_id = project.id if project else project_id

        # Save the agent's reply to the database
        agent_msg_record = models.ChatMessageRecord(
            user_id=current_user.id,
            project_id=final_project_id,
            sender="agent",
            text=reply_text
        )
        db.add(agent_msg_record)

        # If a new project was created, update the user's earlier messages
        # that had project_id=None to point to the new project
        if new_project_id:
            db.query(models.ChatMessageRecord).filter(
                models.ChatMessageRecord.user_id == current_user.id,
                models.ChatMessageRecord.project_id == None
            ).update({"project_id": new_project_id}, synchronize_session="fetch")

        db.commit()

        return {
            "reply": reply_text,
            "is_complete": response.is_complete,
            "project_id": final_project_id
        }
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
