from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    company_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    mobile_number = Column(String, nullable=True)

    projects = relationship("Project", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    description = Column(String)
    
    target_platforms = Column(String, nullable=True)
    target_audience = Column(String, nullable=True)
    expected_timeline = Column(String, nullable=True)
    budget_range = Column(String, nullable=True)
    key_features = Column(String, nullable=True)
    existing_systems = Column(String, nullable=True)
    project_type = Column(String, nullable=True)
    ui_ux_design = Column(String, nullable=True)

    status = Column(String, default="SUBMITTED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="projects")

class ChatMessageRecord(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    sender = Column(String, nullable=False)  # 'user' or 'agent'
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User")
    project = relationship("Project")
