import asyncio
import json
import websockets
from typing import Callable, List, Dict, Any

class A2AClient:
    def __init__(self, network_id: str, ws_url: str):
        self.network_id = network_id
        self.ws_url = ws_url
        self.websocket = None
        self._send_queue: asyncio.Queue = asyncio.Queue()
        self.handlers: List[Callable] = []
        self.loop = None
        
    def add_handler(self, handler: Callable):
        self.handlers.append(handler)
        
    async def connect(self):
        self.loop = asyncio.get_running_loop()
        while True:
            try:
                print(f"[{self.network_id.upper()}] Connecting to A2A Gateway at {self.ws_url}...")
                async with websockets.connect(self.ws_url) as websocket:
                    self.websocket = websocket
                    print(f"[{self.network_id.upper()}] Connected to A2A Gateway.")
                    
                    receive_task = asyncio.create_task(self._receive_loop())
                    send_task = asyncio.create_task(self._send_loop())
                    
                    done, pending = await asyncio.wait(
                        [receive_task, send_task],
                        return_when=asyncio.FIRST_COMPLETED
                    )
                    
                    for task in pending:
                        task.cancel()
            except Exception as e:
                print(f"[{self.network_id.upper()}] Connection error: {e}. Reconnecting in 5 seconds...")
                await asyncio.sleep(5)
                
    async def _receive_loop(self):
        try:
            while True:
                data = await self.websocket.recv()
                try:
                    message = json.loads(data)
                    for handler in self.handlers:
                        if asyncio.iscoroutinefunction(handler):
                            asyncio.create_task(handler(message))
                        else:
                            handler(message)
                except json.JSONDecodeError:
                    print(f"[{self.network_id.upper()}] Received invalid JSON.")
                except Exception as e:
                    print(f"[{self.network_id.upper()}] Error in handler: {e}")
        except websockets.ConnectionClosed:
            print(f"[{self.network_id.upper()}] Connection closed.")
            
    async def _send_loop(self):
        try:
            while True:
                message = await self._send_queue.get()
                await self.websocket.send(json.dumps(message))
                self._send_queue.task_done()
        except websockets.ConnectionClosed:
            print(f"[{self.network_id.upper()}] Connection closed while sending.")
            # Put the message back in the queue
            await self._send_queue.put(message)

    def send_message_sync(self, message: Dict[str, Any]):
        if self.loop is None:
            raise RuntimeError("Event loop not set. Client not connected.")
        asyncio.run_coroutine_threadsafe(self._send_queue.put(message), self.loop)

a2a_client = A2AClient(network_id="client-network", ws_url="ws://localhost:8000/ws/client-network")
