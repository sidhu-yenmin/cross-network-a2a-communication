from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import urllib.request, json
import models, schemas, database, dependencies

router = APIRouter(prefix="/api/projects", tags=["projects"])

def transmit_to_company_network(project: models.Project, reproposal: bool = False):
    description_text = project.description or "Not specified"
    if project.project_type or project.ui_ux_design:
        description_text += f"\n\n[Project Type]: {project.project_type or 'Not specified'}\n[UI/UX Design]: {project.ui_ux_design or 'Not specified'}"
        
    payload = {
        "client_project_id": project.id,
        "name": project.name,
        "description": description_text,
        "target_platforms": project.target_platforms or "Not specified",
        "target_audience": project.target_audience or "Not specified",
        "expected_timeline": project.expected_timeline or "Not specified",
        "budget_range": project.budget_range or "Not specified",
        "key_features": project.key_features or "Not specified",
        "existing_systems": project.existing_systems or "Not specified",
        "tech_approach": project.tech_approach or "Not specified",
        "tech_frontend": project.tech_frontend or "Not specified",
        "tech_backend": project.tech_backend or "Not specified",
        "tech_database": project.tech_database or "Not specified",
        "reproposal": reproposal
    }
    try:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            'http://localhost:8000/api/gateway/receive-request', 
            data=data, 
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            print(f"[A2A TRANSMIT] Successfully sent project {project.id} (reproposal={reproposal}) to Company Network. Response: {response.read().decode()}")
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
        project_type=project.project_type or "Not specified",
        ui_ux_design=project.ui_ux_design or "Not specified",
        tech_approach=project.tech_approach or "Not specified",
        tech_frontend=project.tech_frontend or "Not specified",
        tech_backend=project.tech_backend or "Not specified",
        tech_database=project.tech_database or "Not specified",
        status="AWAITING_APPROVAL",
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

@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project_by_id(
    project_id: int,
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(database.get_db)
):
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

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

from pydantic import BaseModel as PydanticBaseModel

class ProposalPayload(PydanticBaseModel):
    project_name: str
    ba_analysis: str
    tech_analysis: str
    cost_analysis: str
    timeline_analysis: str
    risk_analysis: str
    client_agent_report: Optional[str] = None

@router.post("/{project_id}/receive-proposal")
def receive_proposal_from_company(
    project_id: int,
    payload: ProposalPayload,
    db: Session = Depends(database.get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Update project status
    project.status = "NEGOTIATING"
    db.commit()

    # Format the report beautifully using Client Agent review if available, fallback otherwise
    if payload.client_agent_report:
        report_text = (
            f"🤖 **Proposal Presentation & Report (Client Representative Agent)**\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"I have reviewed the proposal compiled by the company PM Agent. Here is my analysis and summary:\n\n"
            f"{payload.client_agent_report}\n\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📝 **Proposal Review Request**\n"
            f"Please review the detailed analysis above. If you approve of the technical architecture, timeline, cost estimates, and risk mitigations, reply with **Approve Proposal** or **OK** to proceed. If you have any questions or require changes, please let me know!"
        )
    else:
        report_text = (
            f"🎉 **AI Agent Proposal Analysis Complete**\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"Our specialist AI agents have completed their respective analyses for project: **{payload.project_name}**.\n\n"
            f"Here are the detailed reports:\n\n"
            f"📊 **Business Analysis Report (BA Agent)**\n"
            f"{payload.ba_analysis}\n\n"
            f"🏗️ **Technical Architecture Report (Tech Agent)**\n"
            f"{payload.tech_analysis}\n\n"
            f"💰 **Cost Estimation Report (Cost Agent)**\n"
            f"{payload.cost_analysis}\n\n"
            f"📅 **Timeline & Delivery Report (Timeline Agent)**\n"
            f"{payload.timeline_analysis}\n\n"
            f"⚠️ **Risk Assessment Report (Risk Agent)**\n"
            f"{payload.risk_analysis}\n\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📝 **Proposal Review Request**\n"
            f"Please review the detailed analysis above. If you approve of the technical architecture, timeline, cost estimates, and risk mitigations, reply with **Approve Proposal** or **OK** to proceed. If you have any questions or require changes, please let me know!"
        )

    # Save to ChatMessageRecord
    msg = models.ChatMessageRecord(
        user_id=project.user_id,
        project_id=project.id,
        sender="agent",
        text=report_text
    )
    db.add(msg)
    db.commit()

    print(f"[*] Successfully saved proposal chat message for client project {project_id}")
    return {"message": "Proposal received and client notified"}

@router.post("/{project_id}/reject-reproposal-sync")
def reject_reproposal_sync(
    project_id: int,
    db: Session = Depends(database.get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.status = "REJECTED"
    db.commit()

    report_text = (
        "❌ **Message from Client Representative Agent**:\n"
        "Our re-proposal request with the updated requirements has been **REJECTED** by the PM Agent. "
        "The project status has been updated to Rejected."
    )

    msg = models.ChatMessageRecord(
        user_id=project.user_id,
        project_id=project.id,
        sender="agent",
        text=report_text
    )
    db.add(msg)
    db.commit()

    print(f"[*] Successfully saved re-proposal rejection sync for client project {project_id}")
    return {"message": "Re-proposal rejection sync received and client notified"}

@router.post("/{project_id}/management-approved-sync")
def management_approved_sync(
    project_id: int,
    db: Session = Depends(database.get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.status = "APPROVED"
    db.commit()

    report_text = (
        "🎉 **Message from Client Representative Agent**:\n"
        "Company Network management has officially **APPROVED** the proposal. "
        "The project is now officially approved and onboarding is initiated!"
    )

    msg = models.ChatMessageRecord(
        user_id=project.user_id,
        project_id=project.id,
        sender="agent",
        text=report_text
    )
    db.add(msg)
    db.commit()

    print(f"[*] Successfully saved management approval sync for client project {project_id}")
    return {"message": "Management approval sync received and client notified"}

@router.post("/{project_id}/management-rejected-sync")
def management_rejected_sync(
    project_id: int,
    db: Session = Depends(database.get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.status = "REJECTED"
    db.commit()

    report_text = (
        "❌ **Message from Client Representative Agent**:\n"
        "Company Network management has **REJECTED** the proposal."
    )

    msg = models.ChatMessageRecord(
        user_id=project.user_id,
        project_id=project.id,
        sender="agent",
        text=report_text
    )
    db.add(msg)
    db.commit()

    print(f"[*] Successfully saved management rejection sync for client project {project_id}")
    return {"message": "Management rejection sync received and client notified"}




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

        # Load history containing the user's new message
        db_history = db.query(models.ChatMessageRecord).filter(
            models.ChatMessageRecord.user_id == current_user.id,
            models.ChatMessageRecord.project_id == project_id
        ).order_by(models.ChatMessageRecord.timestamp.asc()).all()

        # Check context: if the last message from agent asked about revising/updating requirements,
        # then a simple 'yes' or 'ok' is likely answering that question, not approving the whole SRS/proposal!
        last_agent_msg = None
        if db_history:
            # Look backwards for the most recent agent message (before the new user message)
            for h in reversed(db_history):
                if h.sender == "agent":
                    last_agent_msg = h.text.lower()
                    break
        
        is_answering_revision_question = False
        if last_agent_msg:
            # If the last agent message is presenting a summary or draft list, it is not a revision question!
            is_summary = any(kw in last_agent_msg for kw in ["summary", "draft", "🔹", "━━━━━━━━━━━━━━━━━"])
            if not is_summary:
                revision_question_triggers = ["revise", "change", "modify", "update", "correct", "different", "instead", "adjust", "incorrect", "would you like to", "do you want to"]
                # Must end with a question mark to be a revision question
                is_answering_revision_question = "?" in last_agent_msg and any(trigger in last_agent_msg for trigger in revision_question_triggers)

        # Check if project exists and status is AWAITING_APPROVAL or REPROPOSAL_ELICITATION
        if project and project.status in ["AWAITING_APPROVAL", "REPROPOSAL_ELICITATION"]:
            msg_lower = chat_request.message.strip().lower().strip("!.,")
            approval_phrases = [
                "k", "y", "ok", "okay", "approve", "approved", "looks good", "yes", "proceed", "correct", 
                "fine", "agree", "go ahead", "confirm", "yes, proceed", "yes proceed", 
                "looks good to me", "that's correct", "perfect", "ok proceed", "ok approve",
                "yes proceed and share"
            ]
            is_explicit_approval_button = msg_lower in ["approve srs & submit", "approve proposal"]
            is_approval = any(phrase == msg_lower or (phrase in msg_lower and len(msg_lower) < len(phrase) + 5) for phrase in approval_phrases)
            has_change_keywords = any(kw in msg_lower for kw in ["change", "modify", "update", "correct to", "instead", "but", "edit"])
            
            if is_explicit_approval_button or (is_approval and not has_change_keywords and not is_answering_revision_question):
                # Approve the project and submit to company network!
                is_reproposal = project.status == "REPROPOSAL_ELICITATION"
                project.status = "SUBMITTED"
                db.commit()
                db.refresh(project)
                
                # Trigger background transmission (reproposal=True if status was REPROPOSAL_ELICITATION)
                background_tasks.add_task(transmit_to_company_network, project, is_reproposal)
                
                if is_reproposal:
                    reply_text = (
                        "Thank you! I have transmitted the updated requirements to the PM Agent. "
                        "The specialist AI agents are now re-analyzing the project. I will let you know once the new proposal is ready!"
                    )
                else:
                    reply_text = "Thank you! The project requirements have been approved and successfully transmitted to the Company Network. Our team is now generating the final proposal."
                
                # Save the agent's reply
                agent_msg_record = models.ChatMessageRecord(
                    user_id=current_user.id,
                    project_id=project.id,
                    sender="agent",
                    text=reply_text
                )
                db.add(agent_msg_record)
                db.commit()
                
                return {
                    "reply": reply_text,
                    "is_complete": True,
                    "project_id": project.id
                }

        # Check if project exists and status is NEGOTIATING
        if project and project.status == "NEGOTIATING":
            msg_lower = chat_request.message.strip().lower().strip("!.,")
            
            # 1. Check if user requested Re-proposal or wants to change/modify requirements
            reproposal_phrases = [
                "reproposal", "re-proposal", "re proposal", "request re-proposal",
                "change", "modify", "update", "adjust", "correct to", "instead", "edit"
            ]
            is_reproposal = any(phrase in msg_lower for phrase in reproposal_phrases)
            
            if is_reproposal:
                # Set status back to REPROPOSAL_ELICITATION so requirements are gathered via LLM chat
                project.status = "REPROPOSAL_ELICITATION"
                db.commit()
                db.refresh(project)
                
                # Make cross-network POST call to Company Network to reset the proposal status there
                try:
                    import urllib.request
                    url = f"http://localhost:8000/api/gateway/incoming-requests-by-client/{project.id}/reproposal"
                    req = urllib.request.Request(url, method="POST")
                    with urllib.request.urlopen(req) as resp:
                        print(f"[*] Company Network proposal marked for RE-PROPOSAL. Code: {resp.status}")
                except Exception as e:
                    print(f"[*] Failed to sync re-proposal request to Company Network: {e}")

                # Conversational custom follow-up questions depending on what they want to change
                if "budget" in msg_lower:
                    reply_text = "Sure! Let's update the budget range. What would you like to change the budget range to?"
                elif "timeline" in msg_lower or "duration" in msg_lower or "schedule" in msg_lower:
                    reply_text = "Sure! Let's update the timeline. What would you like to change the timeline to?"
                elif "feature" in msg_lower:
                    reply_text = "Sure! Let's update the key features. What features would you like to add or modify?"
                elif "platform" in msg_lower:
                    reply_text = "Sure! Let's update the target platforms. What platforms would you like to target instead?"
                elif any(kw in msg_lower for kw in ["tech", "architecture", "frontend", "backend", "database"]):
                    reply_text = "Sure! Let's update the technical design preferences. What changes would you like to make to the Approach, Frontend, Backend, or Database?"
                else:
                    reply_text = (
                        "Understood. I have initiated a re-proposal request with the company network. "
                        "The requirements are now unlocked. Please let me know what changes or modifications "
                        "you would like to make (e.g., to the budget, timeline, platforms, features, etc.), "
                        "and I will help you update them!"
                    )
                
                # Save the agent's reply
                agent_msg_record = models.ChatMessageRecord(
                    user_id=current_user.id,
                    project_id=project.id,
                    sender="agent",
                    text=reply_text
                )
                db.add(agent_msg_record)
                db.commit()
                
                return {
                    "reply": reply_text,
                    "is_complete": False,
                    "project_id": project.id
                }

            # 2. Check for Approval
            approval_phrases = [
                "k", "y", "ok", "okay", "approve", "approved", "looks good", "yes", "proceed", "correct", 
                "fine", "agree", "go ahead", "confirm", "yes, proceed", "yes proceed", 
                "looks good to me", "that's correct", "perfect", "ok proceed", "ok approve",
                "approve proposal", "accept", "accept proposal"
            ]
            is_explicit_approval_button = msg_lower in ["approve srs & submit", "approve proposal"]
            is_approval = any(phrase == msg_lower or (phrase in msg_lower and len(msg_lower) < len(phrase) + 5) for phrase in approval_phrases)
            has_change_keywords = any(kw in msg_lower for kw in ["change", "modify", "update", "correct to", "instead", "but", "edit", "reject", "not ok", "not okay", "no", "incorrect"])
            
            if is_explicit_approval_button or (is_approval and not has_change_keywords and not is_answering_revision_question):
                # Set status to PENDING_MANAGEMENT_APPROVAL and notify company network
                project.status = "PENDING_MANAGEMENT_APPROVAL"
                db.commit()
                db.refresh(project)
                
                # Make cross-network POST call to Company Network to approve the proposal there
                try:
                    import urllib.request
                    url = f"http://localhost:8000/api/gateway/incoming-requests-by-client/{project.id}/approve"
                    req = urllib.request.Request(url, method="POST")
                    with urllib.request.urlopen(req) as resp:
                        print(f"[*] Company Network proposal marked APPROVED by client. Code: {resp.status}")
                except Exception as e:
                    print(f"[*] Failed to sync proposal approval to Company Network: {e}")

                reply_text = "Thank you! I have transmitted your approval to the Company Network. Awaiting their management's final approval."
                
                # Save the agent's reply
                agent_msg_record = models.ChatMessageRecord(
                    user_id=current_user.id,
                    project_id=project.id,
                    sender="agent",
                    text=reply_text
                )
                db.add(agent_msg_record)
                db.commit()
                
                return {
                    "reply": reply_text,
                    "is_complete": False,
                    "project_id": project.id
                }
            else:
                # Reject the proposal / request changes!
                # We keep the status as NEGOTIATING so the user can continue re-negotiating requirements
                project.status = "NEGOTIATING"
                db.commit()
                
                # Make cross-network POST call to Company Network to reject/suggest changes to the proposal
                try:
                    import urllib.request
                    url = f"http://localhost:8000/api/gateway/incoming-requests-by-client/{project.id}/reject"
                    req = urllib.request.Request(url, method="POST")
                    with urllib.request.urlopen(req) as resp:
                        print(f"[*] Company Network proposal marked REJECTED (suggestions logged). Code: {resp.status}")
                except Exception as e:
                    print(f"[*] Failed to sync proposal rejection to Company Network: {e}")

                reply_text = "I have informed the PM Agent that you are not okay with the proposal report. We will review your feedback, make necessary adjustments, and present a revised proposal soon. What specific changes or clarifications would you like us to focus on?"
                
                # Save the agent's reply
                agent_msg_record = models.ChatMessageRecord(
                    user_id=current_user.id,
                    project_id=project.id,
                    sender="agent",
                    text=reply_text
                )
                db.add(agent_msg_record)
                db.commit()
                
                return {
                    "reply": reply_text,
                    "is_complete": False,
                    "project_id": project.id
                }

        # Check if user wants to change a requirement field but has not specified the new value
        if project and project.status in ["AWAITING_APPROVAL", "REPROPOSAL_ELICITATION"]:
            msg_lower = chat_request.message.strip().lower().strip("!.,")
            change_keywords = ["change", "modify", "update", "adjust", "edit", "different"]
            has_change_kw = any(kw in msg_lower for kw in change_keywords)
            
            if has_change_kw:
                # 1. Budget check: if they mention budget but no numeric values are present
                if "budget" in msg_lower and not any(char.isdigit() for char in msg_lower):
                    reply_text = "Sure! Let's update the budget range. What would you like to change the budget range to?"
                    project.status = "REPROPOSAL_ELICITATION"
                    db.commit()
                    
                    # Save the agent's reply
                    agent_msg_record = models.ChatMessageRecord(
                        user_id=current_user.id,
                        project_id=project.id,
                        sender="agent",
                        text=reply_text
                    )
                    db.add(agent_msg_record)
                    db.commit()
                    
                    return {
                        "reply": reply_text,
                        "is_complete": False,
                        "project_id": project.id
                    }
                    
                # 2. Timeline check: if they mention timeline/duration but no numeric values are present
                elif any(kw in msg_lower for kw in ["timeline", "duration", "schedule"]) and not any(char.isdigit() for char in msg_lower) and not any(w in msg_lower for w in ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]):
                    reply_text = "Sure! Let's update the timeline. What would you like to change the timeline to?"
                    project.status = "REPROPOSAL_ELICITATION"
                    db.commit()
                    
                    # Save the agent's reply
                    agent_msg_record = models.ChatMessageRecord(
                        user_id=current_user.id,
                        project_id=project.id,
                        sender="agent",
                        text=reply_text
                    )
                    db.add(agent_msg_record)
                    db.commit()
                    
                    return {
                        "reply": reply_text,
                        "is_complete": False,
                        "project_id": project.id
                    }
                
                # 3. Features check: if they say "change features" or "change feature" but it's very short (less than 35 chars)
                elif "feature" in msg_lower and len(msg_lower) < 35:
                    reply_text = "Sure! Let's update the key features. What features would you like to add or modify?"
                    project.status = "REPROPOSAL_ELICITATION"
                    db.commit()
                    
                    # Save the agent's reply
                    agent_msg_record = models.ChatMessageRecord(
                        user_id=current_user.id,
                        project_id=project.id,
                        sender="agent",
                        text=reply_text
                    )
                    db.add(agent_msg_record)
                    db.commit()
                    
                    return {
                        "reply": reply_text,
                        "is_complete": False,
                        "project_id": project.id
                    }

                # 4. Target platforms check: if they say "change platforms" but it's very short
                elif "platform" in msg_lower and len(msg_lower) < 35:
                    reply_text = "Sure! Let's update the target platforms. What platforms would you like to target instead?"
                    project.status = "REPROPOSAL_ELICITATION"
                    db.commit()
                    
                    # Save the agent's reply
                    agent_msg_record = models.ChatMessageRecord(
                        user_id=current_user.id,
                        project_id=project.id,
                        sender="agent",
                        text=reply_text
                    )
                    db.add(agent_msg_record)
                    db.commit()
                    
                    return {
                        "reply": reply_text,
                        "is_complete": False,
                        "project_id": project.id
                    }

                # 5. Tech design check: if they say "change tech" or "change database" etc. but it's very short
                elif any(kw in msg_lower for kw in ["tech", "architecture", "frontend", "backend", "database"]) and len(msg_lower) < 35:
                    reply_text = "Sure! Let's update the technical design preferences. What changes would you like to make to the Approach, Frontend, Backend, or Database?"
                    project.status = "REPROPOSAL_ELICITATION"
                    db.commit()
                    
                    # Save the agent's reply
                    agent_msg_record = models.ChatMessageRecord(
                        user_id=current_user.id,
                        project_id=project.id,
                        sender="agent",
                        text=reply_text
                    )
                    db.add(agent_msg_record)
                    db.commit()
                    
                    return {
                        "reply": reply_text,
                        "is_complete": False,
                        "project_id": project.id
                    }

        llm_client = LLMClient()
        # Build history from the database for this project/conversation
        history_dicts = [{"sender": m.sender, "text": m.text} for m in db_history]
        
        if project and project.status in ["REPROPOSAL_ELICITATION", "AWAITING_APPROVAL"]:
            system_prompt = (
                "You are a friendly and professional Project Requirement Assistant in Requirement Modification Mode.\n"
                "The client has already submitted all requirements and is now making modifications or requesting changes to the requirements.\n"
                "Your task is to:\n"
                "1. Accept the client's modifications/changes gracefully (e.g. changes to budget, timeline, key features, etc.).\n"
                "2. Update the corresponding fields (e.g. budget_range, expected_timeline, key_features, etc.) in your JSON output.\n"
                "3. Ask the user if they have any other modifications or if they are ready to compile the updated SRS (e.g. 'I have updated that. Would you like to make any other changes, or are you ready to compile the updated SRS summary?').\n"
                "4. Do NOT set is_complete to True immediately. Only set is_complete to True in the subsequent turn when the client explicitly confirms they are ready or have no more changes (e.g., 'ready', 'yes', 'no more changes', 'proceed', 'go ahead').\n"
                "5. In your reply, briefly explain what you updated, and ask the confirmation question. Never include technical field names, JSON keys, or parenthetical notes (like '(Note: ...)' or '[Note: ...]') in your reply."
            )
        else:
            system_prompt = (
                "You are a friendly, highly professional Project Requirement Assistant. "
                "Your ONLY goal is to interactively chat with the client and gather software project requirements. "
                "Your conversation must flow naturally and be context-aware:\n"
                "1. Ask conversational follow-up questions one at a time. Do NOT list out or dump multiple questions at once.\n"
                "2. The client may reply with simple affirmations, short acknowledgements, or minor typos (e.g., 'k', 'y', 'ok', 'okay', 'yes', 'sure', 'go ahead', etc.). "
                "NEVER treat these as unrelated topics or ignore/redirect them, and never output notes about repeated acknowledgements. Acknowledge them warmly and immediately ask for the next requirement in the same response.\n"
                "3. Check the conversation history carefully. NEVER ask for any information or requirements that the client has already provided. "
                "Only ask for the missing details among the 11 requirements.\n"
                "4. Your reply MUST be clean, natural, human-readable text. Do NOT include any technical characters, JSON keys, stray braces (like '}'), parenthetical notes/disclaimers (like '(Note: ...)' or '[Note: ...]'), or instructions (like 'is_complete') in your reply.\n"
                "5. ABSOLUTE RULE: If you are still gathering details (is_complete is False), your 'reply' MUST always end with a clear, friendly question asking the client for one of the missing requirements. NEVER reply with generic statements without asking a specific question.\n\n"
                "You MUST gather the following 11 details from the client:\n"
                "1. Project Name\n"
                "2. Description (what the software does)\n"
                "3. Project Type (e.g. e-commerce, CRM, mobile app, etc.)\n"
                "4. UI/UX Design Preferences (e.g. modern, dark theme, minimalist)\n"
                "5. Target Platforms (e.g. Web, iOS, Android)\n"
                "6. Target Audience (who will use it)\n"
                "7. Expected Timeline (e.g. 3 months, 6 months) - MANDATORY\n"
                "8. Budget Range (e.g. $10k-$20k) - MANDATORY\n"
                "9. Key Features (list of main features)\n"
                "10. Existing Systems to integrate with (e.g. payment gateway, legacy database)\n"
                "11. Technical Design Preferences (Approach/Architecture, Frontend, Backend, Database. When asking for this, explicitly ask: 'Do you have any technical design preferences? Please tell me your preferences for: Approach (Architecture), Frontend, Backend, Database. Or let me know if you would like me to suggest my recommendations!'). If the client doesn't specify any or asks for recommendations, set tech_approach, tech_frontend, tech_backend, tech_database to 'Not specified' and let the user know we will suggest our standard recommendations: Microservices architecture, React/Flutter frontend, Python/FastAPI backend, PostgreSQL database.\n\n"
                "CRITICAL INSTRUCTION: You MUST ask for the Expected Timeline and the Budget Range. Do NOT skip them.\n\n"
                "FINAL CONFIRMATION RULE: Once you have gathered all 11 details, do NOT set is_complete to True immediately. "
                "First, ask the client for confirmation to compile the SRS (e.g. 'I have collected all 11 project requirements! Are you ready for me to compile the SRS summary for your review?'). "
                "Only when the client confirms this (e.g., 'yes', 'ok', 'sure', 'proceed', 'go ahead') in their next message, you should set is_complete to True and reply with 'Thank you! Let me compile the requirements summary for your approval.'\n\n"
                "ABSOLUTE RULE: Under no circumstances should you answer questions, provide information, or chat about topics completely unrelated to the project (e.g., general knowledge, casual chat, math, code). "
                "However, simple client affirmations like 'ok' or 'yes' must always be accepted as confirmation/acknowledgement and proceeded with."
            )
        
        # Get structured response from LLM
        response = llm_client.generate_chat_response(
            message=chat_request.message,
            history=history_dicts,
            system_prompt=system_prompt
        )
        
        import re
        reply_text = response.reply or ""
        
        # Clean up unwanted/repeated acknowledgments phrases
        unwanted_phrases = ["ignoring the repeated", "repeated acknowledgements", "repeated acknowledgments"]
        if any(p in reply_text.lower() for p in unwanted_phrases):
            reply_text = "Got it! Let's proceed."
            
        # Strip parenthetical/bracketed notes like (Note: ...) or [Note: ...] case-insensitively
        reply_text = re.sub(r'\([nN]ote:.*?\)', '', reply_text)
        reply_text = re.sub(r'\[[nN]ote:.*?\]', '', reply_text)
        reply_text = re.sub(r'\s+', ' ', reply_text).strip()
        
        # Enforce that if is_complete is False, the reply must end with a question mark
        if not response.is_complete and "?" not in reply_text:
            p_name = response.project_name or (project.name if project else "")
            p_desc = response.description or (project.description if project else "")
            p_type = response.project_type or (project.project_type if project else "")
            p_ui = response.ui_ux_design or (project.ui_ux_design if project else "")
            p_plat = response.target_platforms or (project.target_platforms if project else "")
            p_aud = response.target_audience or (project.target_audience if project else "")
            p_time = response.expected_timeline or (project.expected_timeline if project else "")
            p_bud = response.budget_range or (project.budget_range if project else "")
            p_feat = response.key_features or (project.key_features if project else "")
            p_sys = response.existing_systems or (project.existing_systems if project else "")
            p_tech_approach = response.tech_approach or (project.tech_approach if project else "")
            p_tech_frontend = response.tech_frontend or (project.tech_frontend if project else "")
            p_tech_backend = response.tech_backend or (project.tech_backend if project else "")
            p_tech_database = response.tech_database or (project.tech_database if project else "")

            missing_question = None
            if not p_name or p_name.lower().strip("!., ") in ["", "new project request"]:
                missing_question = "What is the name of your project?"
            elif not p_desc or p_desc.lower().strip("!., ") in ["", "generated from chat"]:
                missing_question = "Could you describe what the software does?"
            elif not p_type or p_type.lower().strip("!., ") in ["", "not specified"]:
                missing_question = "What type of project is this (e.g., web application, mobile app, CRM)?"
            elif not p_ui or p_ui.lower().strip("!., ") in ["", "not specified"]:
                missing_question = "Do you have any UI/UX design preferences (e.g. modern, dark theme, minimalist)?"
            elif not p_plat or p_plat.lower().strip("!., ") in ["", "not specified"]:
                missing_question = "Which target platforms should we support (e.g., Web, iOS, Android)?"
            elif not p_aud or p_aud.lower().strip("!., ") in ["", "not specified"]:
                missing_question = "Who is the target audience for this software?"
            elif not p_time or p_time.lower().strip("!., ") in ["", "not specified"]:
                missing_question = "What is your expected timeline or target delivery date for this project?"
            elif not p_bud or p_bud.lower().strip("!., ") in ["", "not specified"]:
                missing_question = "What estimated budget range do you have set aside for this development?"
            elif not p_feat or p_feat.lower().strip("!., ") in ["", "not specified"]:
                missing_question = "What key features should be included in the software?"
            elif not p_sys or p_sys.lower().strip("!., ") in ["", "not specified"]:
                missing_question = "Are there any existing systems or APIs we need to integrate with (e.g. payment gateway)?"
            elif (not p_tech_approach or p_tech_approach.lower().strip("!., ") in ["", "not specified"]) or \
                 (not p_tech_frontend or p_tech_frontend.lower().strip("!., ") in ["", "not specified"]) or \
                 (not p_tech_backend or p_tech_backend.lower().strip("!., ") in ["", "not specified"]) or \
                 (not p_tech_database or p_tech_database.lower().strip("!., ") in ["", "not specified"]):
                missing_question = (
                    "Do you have any technical design preferences? Please tell me your preferences for: "
                    "Approach (Architecture), Frontend, Backend, Database. Or let me know if you would like me to suggest my recommendations!"
                )

            if missing_question:
                reply_text = f"{reply_text.strip()} {missing_question}"

        # Update existing project fields if project exists (always save intermediate/turn updates)
        if project:
            if response.project_name:
                project.name = response.project_name
            if response.description:
                project.description = response.description
            if response.target_platforms:
                project.target_platforms = response.target_platforms
            if response.target_audience:
                project.target_audience = response.target_audience
            if response.expected_timeline:
                project.expected_timeline = response.expected_timeline
            if response.budget_range:
                project.budget_range = response.budget_range
            if response.key_features:
                project.key_features = response.key_features
            if response.existing_systems:
                project.existing_systems = response.existing_systems
            if response.project_type:
                project.project_type = response.project_type
            if response.ui_ux_design:
                project.ui_ux_design = response.ui_ux_design
            if response.tech_approach:
                project.tech_approach = response.tech_approach
            if response.tech_frontend:
                project.tech_frontend = response.tech_frontend
            if response.tech_backend:
                project.tech_backend = response.tech_backend
            if response.tech_database:
                project.tech_database = response.tech_database
            db.commit()
            db.refresh(project)

        new_project_id = None
        
        # If the LLM has decided requirements are complete
        if response.is_complete:
            is_corrected = project is not None
            is_reproposal_elicitation = project is not None and project.status == "REPROPOSAL_ELICITATION"
            
            if project:
                if is_reproposal_elicitation:
                    project.status = "SUBMITTED"
                else:
                    project.status = "AWAITING_APPROVAL"
                    
                db.commit()
                db.refresh(project)
                print(f"[*] Updated existing project {project.id} with extracted requirements (status: {project.status}).")
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
                    project_type=response.project_type or "Not specified",
                    ui_ux_design=response.ui_ux_design or "Not specified",
                    tech_approach=response.tech_approach or "Not specified",
                    tech_frontend=response.tech_frontend or "Not specified",
                    tech_backend=response.tech_backend or "Not specified",
                    tech_database=response.tech_database or "Not specified",
                    status="AWAITING_APPROVAL",
                    user_id=current_user.id
                )
                db.add(project)
                db.commit()
                db.refresh(project)
                new_project_id = project.id
                print(f"[*] Created new project {project.id} from chat (Awaiting Approval).")

            # Generate the SRS summary in the requested format
            if is_reproposal_elicitation:
                title = "📋 Updated Re-proposal Requirements Summary"
            else:
                title = "📋 Corrected Project Requirements Summary" if is_corrected else "📋 Project Requirements Summary"
            
            srs_text = (
                f"{title}\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                f"🔹 Project Name     : {project.name or 'Not specified'}\n"
                f"🔹 Description      : {project.description or 'Not specified'}\n"
                f" \n"
                f"[Project Type]: {project.project_type or 'Not specified'}\n"
                f" \n"
                f"[UI/UX Design]: {project.ui_ux_design or 'Not specified'}\n"
                f"🔹 Target Platforms : {project.target_platforms or 'Not specified'}\n"
                f"🔹 Target Audience  : {project.target_audience or 'Not specified'}\n"
                f"🔹 Timeline         : {project.expected_timeline or 'Not specified'}\n"
                f"🔹 Budget Range     : {project.budget_range or 'Not specified'}\n"
                f"🔹 Key Features     : {project.key_features or 'Not specified'}\n"
                f"🔹 Existing Systems : {project.existing_systems or 'Not specified'}\n"
                f" \n"
                f"[Technical Approach]: {project.tech_approach or 'Not specified'}\n"
                f"[Frontend Tech]     : {project.tech_frontend or 'Not specified'}\n"
                f"[Backend Tech]      : {project.tech_backend or 'Not specified'}\n"
                f"[Database Tech]     : {project.tech_database or 'Not specified'}\n"
                f"━━━━━━━━━━━━━━━━━"
            )
            
            if is_reproposal_elicitation:
                reply_text = (
                    f"{srs_text}\n\n"
                    f"I have transmitted the updated requirements to the PM Agent. The specialist AI agents are now re-analyzing the project. I will let you know once the new proposal is ready!"
                )
                # Automatically trigger transmission to company network as a reproposal request
                background_tasks.add_task(transmit_to_company_network, project, True)
            else:
                reply_text = (
                    f"{srs_text}\n\n"
                    f"Please review the summary above. If it looks correct, reply with **Approve** or **OK** "
                    f"to submit this project to the Company Network. If you'd like to change anything, just let me know!"
                )
        else:
            if project and project.status in ["REPROPOSAL_ELICITATION", "AWAITING_APPROVAL"]:
                draft_text = (
                    f"\n\n📋 **Current Requirements Draft**:\n"
                    f"• **Project Name**: {project.name or 'Not specified'}\n"
                    f"• **Description**: {project.description or 'Not specified'}\n"
                    f"• **Project Type**: {project.project_type or 'Not specified'}\n"
                    f"• **UI/UX Design**: {project.ui_ux_design or 'Not specified'}\n"
                    f"• **Target Platforms**: {project.target_platforms or 'Not specified'}\n"
                    f"• **Target Audience**: {project.target_audience or 'Not specified'}\n"
                    f"• **Timeline**: {project.expected_timeline or 'Not specified'}\n"
                    f"• **Budget Range**: {project.budget_range or 'Not specified'}\n"
                    f"• **Key Features**: {project.key_features or 'Not specified'}\n"
                    f"• **Existing Systems**: {project.existing_systems or 'Not specified'}\n"
                    f"• **Tech Approach**: {project.tech_approach or 'Not specified'}\n"
                    f"• **Frontend Tech**: {project.tech_frontend or 'Not specified'}\n"
                    f"• **Backend Tech**: {project.tech_backend or 'Not specified'}\n"
                    f"• **Database Tech**: {project.tech_database or 'Not specified'}\n"
                    f"━━━━━━━━━━━━━━━━━\n"
                    f"Please review the updated summary above. If it looks correct, reply with **Approve** or **OK** "
                    f"to submit this project to the Company Network. If you'd like to change anything, just let me know!"
                )
                reply_text += draft_text
            
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
