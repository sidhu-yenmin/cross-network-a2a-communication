from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database, models
from routers import auth, projects
from contextlib import asynccontextmanager
import asyncio
from a2a_client import a2a_client
from a2a_handlers import handle_incoming_a2a_message

# Create DB tables
models.Base.metadata.create_all(bind=database.engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    a2a_client.add_handler(handle_incoming_a2a_message)
    asyncio.create_task(a2a_client.connect())
    yield

app = FastAPI(title="Client Network Backend API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)

@app.get("/")
def read_root():
    return {"message": "Client Network Backend is running"}
