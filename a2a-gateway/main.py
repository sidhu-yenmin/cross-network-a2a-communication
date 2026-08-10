import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict

app = FastAPI(title="A2A Gateway API")

class ConnectionManager:
    def __init__(self):
        # Maps network_id to WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, network_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[network_id] = websocket
        print(f"[GATEWAY] {network_id} connected.")

    def disconnect(self, network_id: str):
        if network_id in self.active_connections:
            del self.active_connections[network_id]
            print(f"[GATEWAY] {network_id} disconnected.")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def forward_message(self, target_network: str, message: dict):
        if target_network in self.active_connections:
            websocket = self.active_connections[target_network]
            await websocket.send_text(json.dumps(message))
            print(f"[GATEWAY] Forwarded message to {target_network}")
        else:
            print(f"[GATEWAY] Target {target_network} not connected. Message dropped.")

manager = ConnectionManager()

@app.get("/")
def read_root():
    return {"message": "A2A Gateway is running"}

@app.websocket("/ws/{network_id}")
async def websocket_endpoint(websocket: WebSocket, network_id: str):
    await manager.connect(network_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                target_network = message.get("target_network")
                if target_network:
                    await manager.forward_message(target_network, message)
                else:
                    print(f"[GATEWAY] No target_network specified in message: {message}")
            except json.JSONDecodeError:
                print(f"[GATEWAY] Invalid JSON received from {network_id}")
    except WebSocketDisconnect:
        manager.disconnect(network_id)
