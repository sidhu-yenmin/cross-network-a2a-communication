from typing import List, Callable, Optional
from .core.base_agent import BaseAgent, AgentType

class ClientAgent(BaseAgent):
    def __init__(self, tools: Optional[List[Callable]] = None):
        super().__init__(
            agent_id="client-agent",
            organization="Client Organization",
            role="Client Representative Agent",
            goal="Represent the client organization and prepare project requirements for collaboration with the software company.",
            agent_type=AgentType.CLIENT,
            system_prompt="""
                You are the Client Representative Agent.

                Your responsibility is to represent the client organization,
                understand project needs, validate requirements, ask
                clarifying questions when information is missing, and
                communicate with company agents through A2A messaging.

                Do not make assumptions when critical information is missing.
            """,
            capabilities=[
                "requirement_validation",
                "requirement_summarization",
                "missing_information_detection",
                "clarification_generation",
                "project_request_submission",
                "communication_with_company_agents",
                "proposal_review_assistance"
            ],
            tools=tools
        )
