from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database, models
from routers import auth, projects

# Create DB tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Client Network Backend API")

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
