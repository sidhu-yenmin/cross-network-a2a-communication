import json
import os
from typing import Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from pydantic import BaseModel, Field

class AgentChatResponse(BaseModel):
    reply: str = Field(description="Your conversational reply to the client. MUST decline to answer if the user asks about unrelated topics, and steer them back to project requirements.")
    is_complete: bool = Field(description="Set to true ONLY if you have gathered all necessary information (name, description, target platforms, target audience, expected timeline, budget range, key features, existing systems) and are ready to finalize.")
    project_name: str = Field(default="", description="The name of the project")
    description: str = Field(default="", description="Detailed requirements of the project")
    target_platforms: str = Field(default="", description="Target platforms (e.g., Web, iOS, Android)")
    target_audience: str = Field(default="", description="Target audience or industry")
    expected_timeline: str = Field(default="", description="Expected timeline for the project")
    budget_range: str = Field(default="", description="The client's budget range")
    key_features: str = Field(default="", description="Key features required")
    existing_systems: str = Field(default="", description="Existing systems to integrate with")

class LLMClient:
    def __init__(self, config_path: str = "config.json"):
        # Resolve path relative to this file's backend directory if just "config.json"
        if config_path == "config.json":
            backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            config_path = os.path.join(backend_dir, "config.json")
            
        with open(config_path, "r") as f:
            config = json.load(f)
            
        ollama_cfg = config.get("ollama_llama", {})
        
        self.llm = ChatOpenAI(
            base_url=f"{ollama_cfg.get('base_url', 'http://localhost:11434')}/v1",
            api_key="ollama", # placeholder required by openai client
            model=ollama_cfg.get("model", "llama3.1:8b"),
            temperature=0.7 # conversational temperature
        )

    def generate_chat_response(self, message: str, history: List[Dict[str, str]], system_prompt: str = "") -> AgentChatResponse:
        """
        Interactively chats with the client based on requirements.
        history format: [{"sender": "user", "text": "..."}, {"sender": "agent", "text": "..."}]
        """
        messages = []
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
            
        # Append history
        for h in history:
            if h.get("sender") == "user":
                messages.append(HumanMessage(content=h.get("text", "")))
            elif h.get("sender") == "agent":
                messages.append(AIMessage(content=h.get("text", "")))
                
        # Append the current message
        messages.append(HumanMessage(content=message))
        
        structured_llm = self.llm.with_structured_output(AgentChatResponse)
        response = structured_llm.invoke(messages)
        return response
