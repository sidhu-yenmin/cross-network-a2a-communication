import json
import asyncio
from database import SessionLocal
import models

async def handle_incoming_a2a_message(message: dict):
    message_type = message.get("message_type")
    
    if message_type == "PROPOSAL_GENERATED":
        project_id = message.get("client_project_id")
        payload = message.get("payload", {})
        
        db = SessionLocal()
        try:
            project = db.query(models.Project).filter(models.Project.id == project_id).first()
            if not project:
                print(f"[CLIENT A2A] Project {project_id} not found.")
                return

            project.status = "NEGOTIATING"
            db.commit()

            client_agent_report = payload.get("client_agent_report")
            if client_agent_report:
                report_text = (
                    f"🤖 **Proposal Presentation & Report (Client Representative Agent)**\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"I have reviewed the proposal compiled by the company PM Agent. Here is my analysis and summary:\n\n"
                    f"{client_agent_report}\n\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"📝 **Proposal Review Request**\n"
                    f"Please review the detailed analysis above. If you approve of the technical architecture, timeline, cost estimates, and risk mitigations, reply with **Approve Proposal** or **OK** to proceed. If you have any questions or require changes, please let me know!"
                )
            else:
                report_text = (
                    f"🎉 **AI Agent Proposal Analysis Complete**\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"Our specialist AI agents have completed their respective analyses for project: **{payload.get('project_name')}**.\n\n"
                    f"Here are the detailed reports:\n\n"
                    f"📊 **Business Analysis Report (BA Agent)**\n"
                    f"{payload.get('ba_analysis')}\n\n"
                    f"🏗️ **Technical Architecture Report (Tech Agent)**\n"
                    f"{payload.get('tech_analysis')}\n\n"
                    f"💰 **Cost Estimation Report (Cost Agent)**\n"
                    f"{payload.get('cost_analysis')}\n\n"
                    f"📅 **Timeline & Delivery Report (Timeline Agent)**\n"
                    f"{payload.get('timeline_analysis')}\n\n"
                    f"⚠️ **Risk Assessment Report (Risk Agent)**\n"
                    f"{payload.get('risk_analysis')}\n\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"📝 **Proposal Review Request**\n"
                    f"Please review the detailed analysis above. If you approve of the technical architecture, timeline, cost estimates, and risk mitigations, reply with **Approve Proposal** or **OK** to proceed. If you have any questions or require changes, please let me know!"
                )

            msg = models.ChatMessageRecord(
                user_id=project.user_id,
                project_id=project.id,
                sender="agent",
                text=report_text
            )
            db.add(msg)
            db.commit()
            print(f"[CLIENT A2A] Successfully handled PROPOSAL_GENERATED for project {project_id}")
        finally:
            db.close()

    elif message_type == "REJECT_REPROPOSAL_SYNC":
        project_id = message.get("client_project_id")
        db = SessionLocal()
        try:
            project = db.query(models.Project).filter(models.Project.id == project_id).first()
            if project:
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
                print(f"[CLIENT A2A] Handled REJECT_REPROPOSAL_SYNC for project {project_id}")
        finally:
            db.close()

    elif message_type == "MANAGEMENT_APPROVED_SYNC":
        project_id = message.get("client_project_id")
        db = SessionLocal()
        try:
            project = db.query(models.Project).filter(models.Project.id == project_id).first()
            if project:
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
                print(f"[CLIENT A2A] Handled MANAGEMENT_APPROVED_SYNC for project {project_id}")
        finally:
            db.close()

    elif message_type == "MANAGEMENT_REJECTED_SYNC":
        project_id = message.get("client_project_id")
        db = SessionLocal()
        try:
            project = db.query(models.Project).filter(models.Project.id == project_id).first()
            if project:
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
                print(f"[CLIENT A2A] Handled MANAGEMENT_REJECTED_SYNC for project {project_id}")
        finally:
            db.close()
