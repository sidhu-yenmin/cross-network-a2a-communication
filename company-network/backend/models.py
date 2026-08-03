from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

class IncomingProject(Base):
    __tablename__ = "incoming_projects"

    id = Column(Integer, primary_key=True, index=True)
    client_project_id = Column(Integer, index=True) # ID from the client network
    name = Column(String, index=True)
    description = Column(String)
    
    target_platforms = Column(String, nullable=True)
    target_audience = Column(String, nullable=True)
    expected_timeline = Column(String, nullable=True)
    budget_range = Column(String, nullable=True)
    key_features = Column(String, nullable=True)
    existing_systems = Column(String, nullable=True)

    agent_status = Column(String, default="PENDING_ANALYSIS")
    proposal_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AgentChatMessage(Base):
    """Stores real-time agent delegation messages for a project, shown in the PM chat UI."""
    __tablename__ = "agent_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, index=True)          # IncomingProject.id
    client_project_id = Column(Integer, index=True)   # for frontend lookup
    sender_agent = Column(String)                      # e.g. "PM Agent", "Cost Agent"
    sender_type = Column(String)                       # "pm" | "ba" | "tech" | "cost" | "timeline" | "risk"
    message = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

