import time
import json
from sqlalchemy.orm import Session
import database
import models
from .agent_definitions import PMAgent, BAAgent, TechnicalAgent, CostAgent, TimelineAgent, RiskAgent

class AgentOrchestrator:
    def __init__(self, db: Session):
        self.db = db
        # Instantiate the agents
        self.pm_agent = PMAgent()
        self.ba_agent = BAAgent()
        self.tech_agent = TechnicalAgent()
        self.cost_agent = CostAgent()
        self.timeline_agent = TimelineAgent()
        self.risk_agent = RiskAgent()

    def process_incoming_request(self, project_id: int):
        print(f"[ORCHESTRATOR] Starting processing for incoming project {project_id}")
        
        # 1. Fetch project
        project = self.db.query(models.IncomingProject).filter(models.IncomingProject.id == project_id).first()
        if not project:
            print(f"[ORCHESTRATOR] Project {project_id} not found.")
            return

        # 2. Update status to ANALYZING
        project.agent_status = "ANALYZING"
        self.db.commit()
        
        print(f"[PM AGENT] Analyzing requirements for: {project.name}")
        time.sleep(2) # Simulate thinking
        
        print(f"[BA AGENT] Extracting functional requirements for target audience: {project.target_audience}")
        time.sleep(2)
        ba_output = {
            "functional_requirements": [
                f"User authentication and authorization for {project.target_audience}",
                f"Core dashboard and data management for {project.name}",
                f"Support for key features: {project.key_features}"
            ],
            "non_functional_requirements": [
                "99.9% uptime",
                "Sub-second response time",
                f"Integration with existing systems: {project.existing_systems}"
            ]
        }
        
        print(f"[TECH AGENT] Designing architecture for platforms: {project.target_platforms}")
        time.sleep(2)
        tech_output = {
            "architecture": "Microservices-based cloud architecture",
            "frontend": f"React/Vue tailored for {project.target_platforms}",
            "backend": "Python/FastAPI or Node.js",
            "database": "PostgreSQL with Redis caching"
        }
        
        print(f"[COST AGENT] Estimating budget within client range: {project.budget_range}")
        time.sleep(2)
        cost_output = {
            "estimated_cost": f"Aligns with {project.budget_range}",
            "team_composition": ["1 PM", "2 Frontend", "2 Backend", "1 QA", "1 DevOps"]
        }
        
        print(f"[TIMELINE AGENT] Mapping milestones against timeline: {project.expected_timeline}")
        time.sleep(2)
        timeline_output = {
            "duration": project.expected_timeline,
            "milestones": [
                "Sprint 1: Setup and Architecture",
                "Sprint 2: Core Features",
                "Sprint 3: Key Integrations",
                "Sprint 4: Testing and Deployment"
            ]
        }
        
        print(f"[RISK AGENT] Assessing delivery risks...")
        time.sleep(2)
        risk_output = {
            "risks": [
                {"description": f"Integration complexity with {project.existing_systems}", "mitigation": "Early API discovery phase"},
                {"description": "Scope creep in key features", "mitigation": "Strict change request process"}
            ]
        }
        
        print(f"[PM AGENT] Compiling final proposal...")
        time.sleep(2)
        final_proposal = {
            "project_name": project.name,
            "summary": project.description,
            "business_analysis": ba_output,
            "technical_design": tech_output,
            "financial_estimate": cost_output,
            "delivery_schedule": timeline_output,
            "risk_assessment": risk_output
        }
        
        # 3. Save the proposal and update status
        # Note: In a complete implementation, this would be saved to a specific `Proposals` table.
        # For this PoC workflow, we'll store it in a generic text column or just change the status.
        # Since we don't have a proposal column yet, let's just update the status.
        project.agent_status = "PROPOSAL_GENERATED"
        self.db.commit()
        
        print(f"[ORCHESTRATOR] Processing complete for project {project_id}. Proposal generated.")
