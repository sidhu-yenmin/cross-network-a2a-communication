import asyncio
import os
import sys

# Add both backends to path so we can import their agents
base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(base_dir, "company-network", "backend"))
sys.path.append(os.path.join(base_dir, "client-network", "backend"))

from company_network.backend.agents.agent_definitions import ClientAgent as CompanyClientAgent
from client_network.backend.agents.agent_definitions import ClientAgent as ClientNetworkClientAgent

def run_test():
    print("Testing ClientAgent with LLM Integration...")
    # Using the company network Client Agent for testing
    from agents.agent_definitions import ClientAgent
    
    agent = ClientAgent()
    print(f"Agent initialized: {agent.agent_id}")
    if agent.llm_client:
        print("LLM Client successfully initialized.")
    else:
        print("Warning: LLM Client is None")

    # Simulate a form
    mock_form_data = {
        "client_name": "Acme Corp",
        "project_type": "E-commerce Website",
        "budget": "$50k",
        "timeline": "ASAP",
        "notes": "We need an e-commerce site to sell widgets. It should integrate with Stripe."
        # missing: target audience, design preferences, specific features besides Stripe
    }

    print("\nRunning reasoning flow with form data...")
    decision = agent.reason(mock_form_data)
    
    print("\n--- LLM Decision Result ---")
    for k, v in decision.items():
        print(f"{k}: {v}")
    print("---------------------------\n")
    
if __name__ == "__main__":
    run_test()
