import time
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
import database
import models
from .agent_definitions import PMAgent, BAAgent, TechnicalAgent, CostAgent, TimelineAgent, RiskAgent
from .core.llm_provider import LLMClient


def _save_message(db: Session, project: models.IncomingProject, sender_agent: str, sender_type: str, message: str):
    """Persist a live agent chat message to the database."""
    msg = models.AgentChatMessage(
        project_id=project.id,
        client_project_id=project.client_project_id,
        sender_agent=sender_agent,
        sender_type=sender_type,
        message=message
    )
    db.add(msg)
    db.commit()
    print(f"[{sender_agent.upper()}] {message[:80]}...")


def _build_project_context(project: models.IncomingProject) -> str:
    return (
        f"Project Name: {project.name}\n"
        f"Description: {project.description}\n"
        f"Target Platforms: {project.target_platforms}\n"
        f"Target Audience: {project.target_audience}\n"
        f"Expected Timeline: {project.expected_timeline}\n"
        f"Budget Range: {project.budget_range}\n"
        f"Key Features: {project.key_features}\n"
        f"Existing Systems to Integrate: {project.existing_systems}"
    )


class AgentOrchestrator:
    def __init__(self, db: Session):
        self.db = db
        self.llm = LLMClient()
        self.pm_agent = PMAgent()
        self.ba_agent = BAAgent()
        self.tech_agent = TechnicalAgent()
        self.cost_agent = CostAgent()
        self.timeline_agent = TimelineAgent()
        self.risk_agent = RiskAgent()

    def process_incoming_request(self, project_id: int):
        print(f"[ORCHESTRATOR] Starting processing for incoming project {project_id}")

        project = self.db.query(models.IncomingProject).filter(models.IncomingProject.id == project_id).first()
        if not project:
            print(f"[ORCHESTRATOR] Project {project_id} not found.")
            return

        project.agent_status = "ANALYZING"
        self.db.commit()

        ctx = _build_project_context(project)

        # ─── PM AGENT: DELEGATION ANNOUNCEMENT ──────────────────────────────
        _save_message(self.db, project, "PM Agent", "pm",
            f"📋 New project received: \"{project.name}\"\n"
            f"I am now delegating this to our specialist agents for a full review.\n"
            f"🔹 BA Agent     → Requirement Analysis\n"
            f"🔹 Technical Agent → Architecture Design\n"
            f"🔹 Cost Agent   → Budget Estimation\n"
            f"🔹 Timeline Agent → Delivery Schedule\n"
            f"🔹 Risk Agent   → Risk Assessment\n"
            f"Standing by to compile the final proposal once all agents report back.")

        time.sleep(1)

        # ─── BA AGENT ────────────────────────────────────────────────────────
        _save_message(self.db, project, "BA Agent", "ba",
            f"✅ Task received from PM Agent. Analyzing business requirements for \"{project.name}\"...")

        ba_analysis = self.llm.analyze(
            system_prompt=(
                "You are a Business Analysis Specialist at a software company. "
                "Review the client's project requirements. "
                "List the functional requirements, non-functional requirements, and any gaps or concerns. "
                "If the requirements are insufficient, unclear, or missing important details, "
                "clearly state what is missing and suggest what should be clarified. "
                "Keep your response concise and structured (use bullet points)."
            ),
            user_message=f"Please analyze these project requirements:\n\n{ctx}"
        )

        _save_message(self.db, project, "BA Agent", "ba",
            f"📊 Requirement Analysis Complete:\n{ba_analysis}\n\n"
            f"📨 Reporting findings to PM Agent.")

        time.sleep(1)

        # ─── TECHNICAL AGENT ─────────────────────────────────────────────────
        _save_message(self.db, project, "Technical Agent", "tech",
            f"✅ Task received from PM Agent. Designing technical architecture for \"{project.name}\"...")

        tech_analysis = self.llm.analyze(
            system_prompt=(
                "You are a Solution Architect at a software company. "
                "Review the client's project requirements and propose a technical architecture. "
                "Include: recommended tech stack, frontend, backend, database, and API strategy. "
                "If the platform requirements or existing systems create technical challenges, "
                "flag them and suggest alternatives. Be concise and use bullet points."
            ),
            user_message=f"Please design the technical solution for:\n\n{ctx}"
        )

        _save_message(self.db, project, "Technical Agent", "tech",
            f"🏗️ Technical Architecture Design Complete:\n{tech_analysis}\n\n"
            f"📨 Reporting to PM Agent.")

        time.sleep(1)

        # ─── COST AGENT ──────────────────────────────────────────────────────
        _save_message(self.db, project, "Cost Agent", "cost",
            f"✅ Task received from PM Agent. Estimating project cost for \"{project.name}\"...")

        cost_analysis = self.llm.analyze(
            system_prompt=(
                "You are a Cost Estimation Specialist at a software company. "
                "Review the client's project requirements and estimate the development cost. "
                "Break down the cost by team composition and phases. "
                "IMPORTANT: If the client's stated budget is too low for the requested features or timeline, "
                "clearly flag this mismatch and provide a realistic cost estimate with an explanation. "
                "Suggest what features could be reduced or phased to fit the stated budget if needed. "
                "Be specific with numbers. Use bullet points."
            ),
            user_message=f"Please estimate the cost for:\n\n{ctx}"
        )

        _save_message(self.db, project, "Cost Agent", "cost",
            f"💰 Cost Estimation Complete:\n{cost_analysis}\n\n"
            f"📨 Reporting to PM Agent.")

        time.sleep(1)

        # ─── TIMELINE AGENT ──────────────────────────────────────────────────
        _save_message(self.db, project, "Timeline Agent", "timeline",
            f"✅ Task received from PM Agent. Planning delivery schedule for \"{project.name}\"...")

        timeline_analysis = self.llm.analyze(
            system_prompt=(
                "You are a Delivery Planner at a software company. "
                "Review the client's project requirements and create a realistic delivery schedule. "
                "Break it down into sprints/milestones. "
                "IMPORTANT: If the client's expected timeline is too short for the features requested, "
                "clearly flag this with an explanation and suggest a realistic timeline. "
                "Also suggest which features could be delivered in a first MVP vs later phases. "
                "Use bullet points and be specific."
            ),
            user_message=f"Please create the delivery schedule for:\n\n{ctx}"
        )

        _save_message(self.db, project, "Timeline Agent", "timeline",
            f"📅 Delivery Schedule Complete:\n{timeline_analysis}\n\n"
            f"📨 Reporting to PM Agent.")

        time.sleep(1)

        # ─── RISK AGENT ──────────────────────────────────────────────────────
        _save_message(self.db, project, "Risk Agent", "risk",
            f"✅ Task received from PM Agent. Assessing risks for \"{project.name}\"...")

        risk_analysis = self.llm.analyze(
            system_prompt=(
                "You are a Risk Analyst at a software company. "
                "Review the client's project requirements and identify key risks. "
                "For each risk provide: description, severity (High/Medium/Low), and mitigation strategy. "
                "Include technical risks, budget risks, timeline risks, and integration risks. "
                "If any client requirement is unrealistic or poses a significant risk, call it out clearly. "
                "Use bullet points and be concise."
            ),
            user_message=f"Please assess risks for:\n\n{ctx}"
        )

        _save_message(self.db, project, "Risk Agent", "risk",
            f"⚠️ Risk Assessment Complete:\n{risk_analysis}\n\n"
            f"📨 Reporting to PM Agent.")

        time.sleep(1)

        # ─── PM AGENT: COMPILE FINAL PROPOSAL ────────────────────────────────
        _save_message(self.db, project, "PM Agent", "pm",
            f"✅ All agents have completed their analysis for \"{project.name}\".\n"
            f"Compiling the final proposal now...")

        final_proposal = {
            "project_name": project.name,
            "summary": project.description,
            "business_analysis": {
                "full_analysis": ba_analysis,
                "functional_requirements": [
                    f"User auth & management for {project.target_audience}",
                    f"Core features: {project.key_features}",
                    f"Integration with: {project.existing_systems}"
                ],
                "non_functional_requirements": [
                    "99.9% uptime SLA",
                    "Sub-second API response time",
                    f"Support for platforms: {project.target_platforms}"
                ]
            },
            "technical_design": {
                "full_analysis": tech_analysis,
                "architecture": "Microservices-based cloud architecture",
                "frontend": f"React Native / Flutter for {project.target_platforms}",
                "backend": "Python/FastAPI with REST & WebSocket APIs",
                "database": "PostgreSQL + Redis caching"
            },
            "financial_estimate": {
                "full_analysis": cost_analysis,
                "estimated_cost": f"Reviewed against stated budget: {project.budget_range}",
                "team_composition": ["1 PM", "2 Frontend", "2 Backend", "1 QA", "1 DevOps"]
            },
            "delivery_schedule": {
                "full_analysis": timeline_analysis,
                "duration": project.expected_timeline,
                "milestones": [
                    "Phase 1: Architecture & Setup",
                    "Phase 2: Core Features (MVP)",
                    "Phase 3: Integrations & Advanced Features",
                    "Phase 4: QA, UAT & Deployment"
                ]
            },
            "risk_assessment": {
                "full_analysis": risk_analysis,
                "risks": [
                    {"description": f"Integration complexity with {project.existing_systems}", "mitigation": "Early API discovery phase"},
                    {"description": "Budget / scope mismatch", "mitigation": "Phased delivery with MVP-first approach"},
                    {"description": "Timeline pressure", "mitigation": "Strict change control & sprint reviews"}
                ]
            }
        }

        project.proposal_data = final_proposal
        project.agent_status = "PROPOSAL_GENERATED"
        self.db.commit()

        _save_message(self.db, project, "PM Agent", "pm",
            f"🎉 Proposal for \"{project.name}\" is ready!\n"
            f"All specialist agents have completed their analysis. "
            f"The full proposal has been saved and is ready for review in the Proposal section.\n"
            f"Summary:\n"
            f"  • BA Agent flagged key requirements ✅\n"
            f"  • Technical Agent designed the architecture ✅\n"
            f"  • Cost Agent reviewed the budget ✅\n"
            f"  • Timeline Agent planned the delivery schedule ✅\n"
            f"  • Risk Agent identified and mitigated risks ✅")

        print(f"[ORCHESTRATOR] Processing complete for project {project_id}. Proposal generated.")
