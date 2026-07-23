from fastapi import FastAPI

app = FastAPI(title="Company Network Backend API")

@app.get("/")
def read_root():
    return {"message": "Company Network Backend is running"}
