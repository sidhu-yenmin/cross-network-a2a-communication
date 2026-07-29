from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import os
import smtplib
from email.message import EmailMessage
import models, schemas, auth_utils, database
from pydantic import EmailStr

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth_utils.get_password_hash(user.password)
    new_user = models.User(
        full_name=user.full_name,
        company_name=user.company_name,
        email=user.email,
        mobile_number=user.mobile_number,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.username).first()
    if not user or not auth_utils.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token = auth_utils.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == request.email).first()
    if not db_user:
        return {"message": "If that email is registered, a reset link will be sent."}
    
    reset_token = auth_utils.create_access_token(
        data={"sub": db_user.email, "type": "reset"}
    )
    
    mail_server = os.environ.get("MAIL_SERVER")
    mail_port = int(os.environ.get("MAIL_PORT", 587))
    mail_username = os.environ.get("MAIL_USERNAME")
    mail_password = os.environ.get("MAIL_PASSWORD")
    mail_from = os.environ.get("MAIL_FROM")
    mail_from_name = os.environ.get("MAIL_FROM_NAME", "Client Network")

    if mail_server and mail_username and mail_password:
        msg = EmailMessage()
        msg.set_content(f"Hello,\n\nPlease click the following link to reset your password:\nhttp://localhost:5174/reset-password?token={reset_token}\n\nThis link will expire in 15 minutes.")
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
        print(f"Link: http://localhost:5174/reset-password?token={reset_token}")
    
    return {"message": "If that email is registered, a reset link will be sent."}

@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    try:
        payload = auth_utils.jwt.decode(request.token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "reset":
            raise HTTPException(status_code=400, detail="Invalid token")
    except auth_utils.jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_user.hashed_password = auth_utils.get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
