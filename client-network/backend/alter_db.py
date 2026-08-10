import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
db_url = os.environ.get("DATABASE_URL", "postgresql://postgres:Yenmin%40123@localhost:5432/client_network")

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type VARCHAR;")
    cur.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS ui_ux_design VARCHAR;")
    conn.commit()
    print("Columns added successfully.")
except Exception as e:
    print("Error:", e)
finally:
    if 'conn' in locals():
        conn.close()
