from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from passlib.context import CryptContext
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

import models
import schemas
import auth
from database import engine, get_db

# Create database tables
print("[DEBUG] Starting create_all...")
models.Base.metadata.create_all(bind=engine)
print("[DEBUG] Finished create_all.")

app = FastAPI(title="Company Network Backend API")
print("[DEBUG] FastAPI app initialized.")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"message": "Company Network Backend is running"}

@app.post("/api/auth/signup", response_model=schemas.Token)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Automatically log in the user after signup
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/signin", response_model=schemas.Token)
def signin(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == request.email).first()
    if not db_user:
        # Avoid giving away whether an email is registered
        return {"message": "If that email is registered, a reset link will be sent."}
    
    reset_token = auth.create_access_token(
        data={"sub": db_user.email, "type": "reset"}, expires_delta=timedelta(minutes=15)
    )
    
    mail_server = os.environ.get("MAIL_SERVER")
    mail_port = int(os.environ.get("MAIL_PORT", 587))
    mail_username = os.environ.get("MAIL_USERNAME")
    mail_password = os.environ.get("MAIL_PASSWORD")
    mail_from = os.environ.get("MAIL_FROM")
    mail_from_name = os.environ.get("MAIL_FROM_NAME", "Company Network")

    if mail_server and mail_username and mail_password:
        msg = EmailMessage()
        msg.set_content(f"Hello,\n\nPlease use the following token to reset your password. We have provided a mock link for your convenience:\nhttp://localhost:5173/reset-password?token={reset_token}\n\nThis token will expire in 15 minutes.")
        msg["Subject"] = "Password Reset Request"
        msg["From"] = f"{mail_from_name} <{mail_from}>"
        msg["To"] = db_user.email

        try:
            with smtplib.SMTP(mail_server, mail_port) as server:
                server.starttls()
                server.login(mail_username, mail_password)
                server.send_message(msg)
            print(f"Email sent successfully to {db_user.email}")
        except Exception as e:
            print(f"Failed to send email: {e}")
            raise HTTPException(status_code=500, detail="Failed to send reset email")
    else:
        print(f"MOCK EMAIL: Send password reset link to {db_user.email} with token {reset_token}")
    
    
    return {"message": "If that email is registered, a reset link will be sent."}

@app.post("/api/auth/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        payload = auth.jwt.decode(request.token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "reset":
            raise HTTPException(status_code=400, detail="Invalid token")
    except auth.JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_user.hashed_password = auth.get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
