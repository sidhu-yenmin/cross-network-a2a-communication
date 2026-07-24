from typing import List, Callable, Optional
from .core.base_agent import BaseAgent, AgentType

class PMAgent(BaseAgent):
    def __init__(self, tools: Optional[List[Callable]] = None):
        super().__init__(
            agent_id="pm-agent",
            organization="SoftwareCompany",
            role="Project Orchestrator",
            goal="Generate a complete software proposal by coordinating specialist AI agents.",
            agent_type=AgentType.PM,
            system_prompt="You are a Project Orchestrator at SoftwareCompany. Generate a complete software proposal by coordinating specialist AI agents.",
            capabilities=[
                "task_planning",
                "agent_delegation",
                "result_collection",
                "proposal_generation"
            ],
            tools=tools
        )

class BAAgent(BaseAgent):
    def __init__(self, tools: Optional[List[Callable]] = None):
        super().__init__(
            agent_id="ba-agent",
            organization="SoftwareCompany",
            role="Business Analysis Specialist",
            goal="Convert business requirements into structured software requirements.",
            agent_type=AgentType.BA,
            system_prompt="You are a Business Analysis Specialist at SoftwareCompany. Convert business requirements into structured software requirements.",
            capabilities=[
                "requirement_analysis",
                "functional_requirement_extraction",
                "non_functional_requirement_identification",
                "user_story_generation",
                "gap_identification"
            ],
            tools=tools
        )

class TechnicalAgent(BaseAgent):
    def __init__(self, tools: Optional[List[Callable]] = None):
        super().__init__(
            agent_id="technical-agent",
            organization="SoftwareCompany",
            role="Solution Architect",
            goal="Create the technical solution design.",
            agent_type=AgentType.TECHNICAL,
            system_prompt="You are a Solution Architect at SoftwareCompany. Create the technical solution design.",
            capabilities=[
                "architecture_design",
                "technology_selection",
                "database_recommendation",
                "api_strategy",
                "scalability_analysis"
            ],
            tools=tools
        )

class CostAgent(BaseAgent):
    def __init__(self, tools: Optional[List[Callable]] = None):
        super().__init__(
            agent_id="cost-agent",
            organization="SoftwareCompany",
            role="Cost Estimation Specialist",
            goal="Estimate project development cost.",
            agent_type=AgentType.COST,
            system_prompt="You are a Cost Estimation Specialist at SoftwareCompany. Estimate project development cost.",
            capabilities=[
                "resource_estimation",
                "development_effort_calculation",
                "infrastructure_cost",
                "licensing_estimation"
            ],
            tools=tools
        )

class TimelineAgent(BaseAgent):
    def __init__(self, tools: Optional[List[Callable]] = None):
        super().__init__(
            agent_id="timeline-agent",
            organization="SoftwareCompany",
            role="Delivery Planner",
            goal="Create project schedule.",
            agent_type=AgentType.TIMELINE,
            system_prompt="You are a Delivery Planner at SoftwareCompany. Create project schedule.",
            capabilities=[
                "sprint_planning",
                "milestone_creation",
                "delivery_estimation",
                "dependency_analysis"
            ],
            tools=tools
        )

class RiskAgent(BaseAgent):
    def __init__(self, tools: Optional[List[Callable]] = None):
        super().__init__(
            agent_id="risk-agent",
            organization="SoftwareCompany",
            role="Risk Analyst",
            goal="Identify and analyze project risks.",
            agent_type=AgentType.RISK,
            system_prompt="You are a Risk Analyst at SoftwareCompany. Identify and analyze project risks.",
            capabilities=[
                "technical_risk_identification",
                "security_risk_analysis",
                "dependency_analysis",
                "delivery_risk_assessment"
            ],
            tools=tools
        )

# For completeness in the PoC, the Client Agent might also be defined here or imported separately
# However, architecturally it belongs to the Client Network.
class ClientAgent(BaseAgent):
    def __init__(self, tools: Optional[List[Callable]] = None):
        super().__init__(
            agent_id="client-agent",
            organization="Client Organization",
            role="Client Representative Agent",
            goal="Represent the client organization and prepare project requirements for collaboration with the software company.",
            agent_type=AgentType.CLIENT,
            system_prompt="You are a Client Representative Agent at the Client Organization. Represent the client organization and prepare project requirements.",
            capabilities=[
                "requirement_validation",
                "requirement_summarization",
                "missing_information_detection",
                "clarification_generation",
                "communication_with_company_agents",
                "proposal_review_assistance"
            ],
            tools=tools
        )
