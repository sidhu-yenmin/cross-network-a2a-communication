import sys
import os

# Set up path to import client agent components
sys.path.append(os.path.abspath('c:/Users/admin/Documents/GitHub/cross-network-a2a-communication/client-network/backend'))

from agents.core.llm_provider import LLMClient

try:
    print("Initializing LLMClient...")
    client = LLMClient()
    
    print("Testing generate_chat_response...")
    res = client.generate_chat_response(
        message="I want to build a fitness app",
        history=[],
        system_prompt="Gather requirements"
    )
    
    print(f"Type of response: {type(res)}")
    print(f"Response: {res}")
    print(f"Reply: {res.reply}")
    
except Exception as e:
    import traceback
    traceback.print_exc()
