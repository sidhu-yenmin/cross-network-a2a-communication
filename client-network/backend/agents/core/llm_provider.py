import json
import os
from typing import Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from pydantic import BaseModel, Field

class AgentChatResponse(BaseModel):
    reply: str = Field(description="MANDATORY. Your conversational reply to the client. This field MUST always contain a non-empty string. If is_complete is true, write a brief confirmation message. If gathering info, ask the next question. NEVER leave this blank.")
    is_complete: bool = Field(description="Set to true ONLY if you have gathered ALL necessary information (name, description, project type, UI/UX design, target platforms, target audience, expected timeline, budget range, key features, existing systems) and are ready to finalize.")
    project_name: str = Field(default="", description="The name of the project")
    description: str = Field(default="", description="Detailed requirements of the project")
    target_platforms: str = Field(default="", description="Target platforms (e.g., Web, iOS, Android)")
    target_audience: str = Field(default="", description="Target audience or industry")
    expected_timeline: str = Field(default="", description="Expected timeline for the project")
    budget_range: str = Field(default="", description="The client's budget range")
    key_features: str = Field(default="", description="Key features required")
    existing_systems: str = Field(default="", description="Existing systems to integrate with")
    project_type: str = Field(default="", description="The type of project (e.g., E-commerce, Healthcare, CRM, etc.)")
    ui_ux_design: str = Field(default="", description="The UI/UX design requirements or preferences")

class LLMClient:
    def __init__(self, config_path: str = "config.json"):
        # Resolve path relative to the backend directory if just "config.json"
        if config_path == "config.json":
            backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            config_path = os.path.join(backend_dir, "config.json")

        with open(config_path, "r") as f:
            config = json.load(f)

        ollama_cfg = config.get("ollama_llama", {})

        self.llm = ChatOpenAI(
            base_url=f"{ollama_cfg.get('base_url', 'http://localhost:11434')}/v1",
            api_key="ollama",  # placeholder required by openai client
            model=ollama_cfg.get("model", "llama3.1:8b"),
            temperature=0.7   # conversational temperature
        )

    def _strip_role_prefix(self, text: str) -> str:
        """Strip role-prefix artifacts that smaller models sometimes prepend."""
        for prefix in ("assistant\n\n", "assistant\n", "assistant: ", "AI:\n\n", "AI: "):
            if text.lower().startswith(prefix.lower()):
                return text[len(prefix):].strip()
        return text

    def generate_chat_response(
        self,
        message: str,
        history: List[Dict[str, str]],
        system_prompt: str = ""
    ) -> AgentChatResponse:
        """
        Interactively chats with the client to gather project requirements.
        history format: [{"sender": "user"|"agent", "text": "..."}]
        """
        # Build message list for the LLM
        messages = []
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))

        for h in history:
            if h.get("sender") == "user":
                messages.append(HumanMessage(content=h.get("text", "")))
            elif h.get("sender") == "agent":
                messages.append(AIMessage(content=h.get("text", "")))

        messages.append(HumanMessage(content=message))

        # Primary path: structured output
        structured_llm = self.llm.with_structured_output(AgentChatResponse)
        response = structured_llm.invoke(messages)

        # Fallback: smaller models sometimes return reply="" when they focus
        # all tokens on filling the structured JSON fields.
        # We make a second plain-text call that respects the same rules:
        #   - off-topic message  → politely decline and redirect
        #   - on-topic message   → acknowledge and ask the next follow-up question
        if not response.reply or not response.reply.strip():
            print("[LLM] WARNING: Structured output returned empty reply. Using fallback.")
            fallback_prompt = (
                system_prompt + "\n\n"
                "RULES FOR YOUR REPLY:\n"
                "1. If the client's message is NOT related to software project requirements "
                "(e.g. general chat, jokes, math, weather, news, unrelated questions), "
                "reply EXACTLY with: "
                "'I'm sorry, I can only assist with gathering your software project requirements. "
                "Please tell me more about the project you'd like to build.'\n"
                "2. If the message IS about their software project, briefly acknowledge it "
                "and ask the single most important missing detail "
                "(budget, timeline, target audience, key features, or existing systems). "
                "Keep your reply to 1-2 sentences.\n\n"
                f"Client said: \"{message}\"\n"
                "Your reply (plain text only — no JSON, no role labels like 'assistant:'):"
            )
            plain_response = self.llm.invoke([SystemMessage(content=fallback_prompt)])
            fallback_text = self._strip_role_prefix(plain_response.content.strip())
            response.reply = fallback_text
            print(f"[LLM] Fallback reply: {response.reply[:120]}...")

        return response
