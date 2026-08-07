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

        # Check if project exists and status is AWAITING_APPROVAL
        if project and project.status == "AWAITING_APPROVAL":
            msg_lower = chat_request.message.strip().lower().strip("!.,")
            approval_phrases = [
                "ok", "approve", "approved", "looks good", "yes", "proceed", "correct", 
                "fine", "agree", "go ahead", "confirm", "yes, proceed", "yes proceed", 
                "looks good to me", "that's correct", "perfect", "ok proceed", "ok approve",
                "yes proceed and share"
            ]
            is_approval = any(phrase == msg_lower or (phrase in msg_lower and len(msg_lower) < len(phrase) + 5) for phrase in approval_phrases)
            has_change_keywords = any(kw in msg_lower for kw in ["change", "modify", "update", "correct to", "instead", "but", "edit"])
            
            if is_approval and not has_change_keywords:
                # Approve the project and submit to company network!
                project.status = "SUBMITTED"
                db.commit()
                db.refresh(project)
                
                # Trigger background transmission
                background_tasks.add_task(transmit_to_company_network, project)
                
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
            
            # 1. Check if user requested Re-proposal
            reproposal_phrases = ["reproposal", "re-proposal", "re proposal", "request re-proposal"]
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
                "ok", "approve", "approved", "looks good", "yes", "proceed", "correct", 
                "fine", "agree", "go ahead", "confirm", "yes, proceed", "yes proceed", 
                "looks good to me", "that's correct", "perfect", "ok proceed", "ok approve",
                "approve proposal", "accept", "accept proposal"
            ]
            is_approval = any(phrase == msg_lower or (phrase in msg_lower and len(msg_lower) < len(phrase) + 5) for phrase in approval_phrases)
            has_change_keywords = any(kw in msg_lower for kw in ["change", "modify", "update", "correct to", "instead", "but", "edit", "reject", "not ok", "not okay", "no", "incorrect"])
            
            if is_approval and not has_change_keywords:
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

        llm_client = LLMClient()
        # Build history from the database for this project/conversation
        db_history = db.query(models.ChatMessageRecord).filter(
            models.ChatMessageRecord.user_id == current_user.id,
            models.ChatMessageRecord.project_id == project_id
        ).order_by(models.ChatMessageRecord.timestamp.asc()).all()
        history_dicts = [{"sender": m.sender, "text": m.text} for m in db_history]
        
        if project and project.status in ["REPROPOSAL_ELICITATION", "AWAITING_APPROVAL"]:
            system_prompt = (
                "You are a friendly and professional Project Requirement Assistant in Requirement Modification Mode.\n"
                "The client has already submitted all requirements and is now making modifications or requesting changes to the requirements.\n"
                "Your task is to:\n"
                "1. Accept the client's modifications/changes gracefully (e.g. changes to budget, timeline, key features, etc.).\n"
                "2. Update the corresponding fields (e.g. budget_range, expected_timeline, key_features, etc.) in your JSON output.\n"
                "3. Set is_complete to True immediately in this turn so that the updated requirements summary can be compiled and shown to the user.\n"
                "4. In your reply, briefly explain what you updated, and end with: 'Here are the changes:' (e.g. 'I have updated the budget to 100,000. Here are the changes:')\n"
                "Do not ask further questions. Set is_complete to True."
            )
        else:
            system_prompt = (
                "You are a friendly and professional Project Requirement Assistant. "
                "Your ONLY goal is to interactively chat with the client and gather software project requirements. "
                "Be concise, polite, and ask one clear question at a time to uncover missing details. "
                "You MUST gather the following 10 details from the client before you can finish:\n"
                "1. Project Name\n"
                "2. Description (what the software does)\n"
                "3. Project Type (e.g. e-commerce, CRM, mobile app, etc.)\n"
                "4. UI/UX Design Preferences (e.g. modern, dark theme, minimalist)\n"
                "5. Target Platforms (e.g. Web, iOS, Android)\n"
                "6. Target Audience (who will use it)\n"
                "7. Expected Timeline (e.g. 3 months, 6 months) - MANDATORY\n"
                "8. Budget Range (e.g. $10k-$20k) - MANDATORY\n"
                "9. Key Features (list of main features)\n"
                "10. Existing Systems to integrate with (e.g. payment gateway, legacy database)\n\n"
                "CRITICAL INSTRUCTION: You MUST ask for the Expected Timeline and the Budget Range. Do NOT skip them. If they are not specified in the conversation history, you MUST ask for them explicitly in your next turns. Do NOT set is_complete to True if Expected Timeline or Budget Range is still missing or not discussed.\n\n"
                "IMPORTANT: If the client corrects or updates any previously provided information (e.g. budget, timeline, features), "
                "always accept the correction gracefully. Say something like 'Got it, I have updated that.' and continue with the next question. Never argue, challenge, or dismiss corrections.\n"
                "Once you have gathered ALL 10 details, mark the conversation as complete internally by setting is_complete to True. Your reply should be a natural confirmation like 'Thank you! I have all the details I need. Let me compile the requirements summary for your approval.'\n"
                "IMPORTANT: NEVER include internal field names, JSON keys, or technical instructions (like 'is_complete', 'set to true', etc.) in your reply to the client. Your reply must always be natural, human-readable text.\n"
                "ABSOLUTE RULE: Under no circumstances should you answer questions, provide information, or chat about topics completely unrelated to the project (e.g., general knowledge, casual chat, math, code). "
                "If the user says anything completely unrelated, politely redirect: 'I appreciate the conversation! However, I am here to help with your project requirements. Could we continue with that?'"
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
            is_corrected = project is not None
            is_reproposal_elicitation = project is not None and project.status == "REPROPOSAL_ELICITATION"
            
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
                project.project_type = response.project_type or project.project_type
                project.ui_ux_design = response.ui_ux_design or project.ui_ux_design
                
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
