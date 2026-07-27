# pyrefly: ignore [missing-import]
import jwt
from datetime import datetime, timedelta, timezone
# pyrefly: ignore [missing-import]
from pwdlib import PasswordHash
# pyrefly: ignore [missing-import]
from pwdlib.hashers.argon2 import Argon2Hasher

SECRET_KEY = "dummy_secret_key_for_poc"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = PasswordHash((Argon2Hasher(),))

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
