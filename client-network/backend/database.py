import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Load .env located in this directory (client-network/backend/.env)
load_dotenv()
 
# Expect DATABASE_URL in environment, default to a local postgres instance for development
SQLALCHEMY_DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:Yenmin%40123@localhost:5432/client_network"
)
 
engine = create_engine(SQLALCHEMY_DATABASE_URL)

try:
    with engine.connect() as con:
        con.execute(text("ALTER TABLE users ADD COLUMN mobile_number VARCHAR;"))
        con.commit()
except Exception as e:
    pass # Ignore if column already exists

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
 
Base = declarative_base()
 
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
 
 