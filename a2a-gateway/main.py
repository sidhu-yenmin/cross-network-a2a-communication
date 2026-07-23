from fastapi import FastAPI

app = FastAPI(title="A2A Gateway API")

@app.get("/")
def read_root():
    return {"message": "A2A Gateway is running"}
