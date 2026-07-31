from typing import Dict, Any, List, Optional, Callable
from enum import Enum

class AgentType(Enum):
    PM = "pm"
    BA = "ba"
    TECHNICAL = "technical"
    COST = "cost"
    TIMELINE = "timeline"
    RISK = "risk"
    CLIENT = "client"

class BaseAgent:
    """
    Base Agent class representing an autonomous entity in the A2A PoC.
    """
    def __init__(
        self,
        agent_id: str,
        organization: str,
        role: str,
        goal: str,
        agent_type: Optional[AgentType] = None,
        capabilities: Optional[List[str]] = None,
        system_prompt: Optional[str] = None,
        tools: Optional[List[Callable]] = None
    ):
        # Identity
        self.agent_id = agent_id
        self.organization = organization
        self.role = role
        self.agent_type = agent_type
        
        # Goal & Scope
        self.goal = goal
        self.capabilities = capabilities if capabilities else []
        self.system_prompt = system_prompt or f"You are a {self.role} at {self.organization}. Your goal is: {self.goal}"
        
        # Memory System
        self.memory = {
            "working_memory": {},
            "decision_memory": [],
            "conversation_memory": []
        }
        
        # Tools
        self.tools = tools if tools else []
        
        # Planning Engine state
        self.plan = []
        
        # LLM Provider
        try:
            from .llm_provider import LLMClient
            self.llm_client = LLMClient()
        except Exception as e:
            print(f"Warning: Could not initialize LLMClient for {self.agent_id}: {e}")
            self.llm_client = None
        
    def add_to_memory(self, memory_type: str, key: str, value: Any):
        """Add context to the agent's memory."""
        if memory_type == "working_memory":
            self.memory["working_memory"][key] = value
        elif memory_type in ["decision_memory", "conversation_memory"]:
            self.memory[memory_type].append({key: value})
            
    def get_from_memory(self, memory_type: str, key: Optional[str] = None):
        """Retrieve context from the agent's memory."""
        if memory_type == "working_memory" and key:
            return self.memory["working_memory"].get(key)
        return self.memory.get(memory_type)

    def create_plan(self, task: str) -> List[str]:
        """
        Planning Engine: Converts a goal or task into executable steps.
        In a real LLM integration, this would call the LLM to generate the plan.
        """
        # Placeholder for PoC planning logic
        self.plan = [f"Execute steps for {task}"]
        return self.plan

    def reason(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Reasoning Engine: Evaluates information and decides actions.
        Uses the LLM to understand requirements and extract entities.
        """
        if self.llm_client:
            try:
                analysis = self.llm_client.analyze_client_form(
                    form_data=context, 
                    system_prompt=self.system_prompt
                )
                return {
                    "decision": "Analyzed form and generated response",
                    "reason": analysis.understanding_summary,
                    "extracted_entities": analysis.extracted_entities,
                    "missing_fields": analysis.missing_fields,
                    "greeting": analysis.greeting,
                    "conversation_starter": analysis.conversation_starter,
                    "confidence": 0.95
                }
            except Exception as e:
                print(f"[{self.agent_id}] LLM Reasoning failed: {e}")

        # Fallback reasoning logic
        return {
            "decision": "Proceed with plan",
            "reason": "Default reasoning step",
            "confidence": 1.0
        }

    def execute_tool(self, tool_name: str, **kwargs) -> Any:
        """
        Execute a tool by name from the tool registry.
        """
        for tool in self.tools:
            if tool.__name__ == tool_name:
                return tool(**kwargs)
        raise ValueError(f"Tool {tool_name} not found for agent {self.agent_id}")

    def send_message(self, target_agent: str, message_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        A2A Communication Layer: Send a message to another agent through the Gateway.
        """
        # Placeholder for A2A communication logic
        print(f"[{self.agent_id}] Sending {message_type} to {target_agent} with payload: {payload}")
        return {"status": "sent", "target": target_agent}

    def receive_message(self, source_agent: str, message_type: str, payload: Dict[str, Any]):
        """
        A2A Communication Layer: Receive a message from another agent.
        """
        print(f"[{self.agent_id}] Received {message_type} from {source_agent}: {payload}")
        self.add_to_memory("conversation_memory", f"msg_from_{source_agent}", payload)

    def run(self, input_data: Dict[str, Any]):
        """
        Agent Execution Lifecycle loop.
        """
        self.add_to_memory("working_memory", "current_input", input_data)
        self.create_plan(self.goal)
        decision = self.reason(input_data)
        return decision
