from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class IncomingProjectCreate(BaseModel):
    client_project_id: int
    name: str
    description: str
    target_platforms: str
    target_audience: str
    expected_timeline: str
    budget_range: str
    key_features: str
    existing_systems: str

class IncomingProjectResponse(BaseModel):
    id: int
    client_project_id: int
    name: str
    description: str
    target_platforms: str
    target_audience: str
    expected_timeline: str
    budget_range: str
    key_features: str
    existing_systems: str
    agent_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
