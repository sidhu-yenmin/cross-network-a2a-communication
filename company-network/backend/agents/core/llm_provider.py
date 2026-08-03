import json
import os
from typing import Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

class LLMClient:
    def __init__(self, config_path: str = "config.json"):
        if config_path == "config.json":
            backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            config_path = os.path.join(backend_dir, "config.json")

        with open(config_path, "r") as f:
            config = json.load(f)

        ollama_cfg = config.get("ollama_llama", {})

        self.llm = ChatOpenAI(
            base_url=f"{ollama_cfg.get('base_url', 'http://localhost:11434')}/v1",
            api_key="ollama",
            model=ollama_cfg.get("model", "llama3.1:8b"),
            temperature=0.7
        )

    def _strip_prefix(self, text: str) -> str:
        for prefix in ("assistant\n\n", "assistant\n", "assistant: ", "AI:\n\n", "AI: "):
            if text.lower().startswith(prefix.lower()):
                return text[len(prefix):].strip()
        return text

    def analyze(self, system_prompt: str, user_message: str) -> str:
        """Run a one-shot analysis with a system prompt and user message."""
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_message)
        ]
        response = self.llm.invoke(messages)
        return self._strip_prefix(response.content.strip())
