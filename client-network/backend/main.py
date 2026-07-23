from fastapi import FastAPI

app = FastAPI(title="Client Network Backend API")

@app.get("/")
def read_root():
    return {"message": "Client Network Backend is running"}
