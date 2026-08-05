from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional

class UserCreate(BaseModel):
    full_name: str
    company_name: str
    email: EmailStr
    password: str
    mobile_number: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    company_name: str
    email: EmailStr
    mobile_number: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150, description="Name of the project")
    description: str = Field(..., min_length=1, description="Detailed requirements")
    target_platforms: str = Field(..., min_length=1, description="Platforms like Web, iOS, etc")
    target_audience: str = Field(..., min_length=1, description="Target user base")
    expected_timeline: str = Field(..., min_length=1, description="Expected delivery timeline")
    budget_range: str = Field(..., min_length=1, description="Estimated budget range")
    key_features: str = Field(..., min_length=1, description="List of must-have features")
    existing_systems: str = Field(..., min_length=1, description="Existing systems to integrate with")
    project_type: Optional[str] = Field(default=None, description="Type of project")
    ui_ux_design: Optional[str] = Field(default=None, description="UI/UX design details")

class ProjectResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: str
    target_platforms: str | None
    target_audience: str | None
    expected_timeline: str | None
    budget_range: str | None
    key_features: str | None
    existing_systems: str | None
    project_type: str | None = None
    ui_ux_design: str | None = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatMessageResponse(BaseModel):
    id: int
    user_id: int
    project_id: Optional[int]
    sender: str
    text: str
    timestamp: datetime

    class Config:
        from_attributes = True
