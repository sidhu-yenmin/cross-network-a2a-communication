# PowerShell script to run all 3 services locally

Write-Host "Starting A2A Gateway on port 8000..."
Start-Process powershell -ArgumentList "-NoExit -Command `".\venv\Scripts\Activate.ps1; uvicorn a2a-gateway.main:app --host 0.0.0.0 --port 8000 --reload`""

Write-Host "Starting Client Network Backend on port 8001..."
Start-Process powershell -ArgumentList "-NoExit -Command `".\venv\Scripts\Activate.ps1; uvicorn client-network.backend.main:app --host 0.0.0.0 --port 8001 --reload`""

Write-Host "Starting Company Network Backend on port 8002..."
Start-Process powershell -ArgumentList "-NoExit -Command `".\venv\Scripts\Activate.ps1; uvicorn company-network.backend.main:app --host 0.0.0.0 --port 8002 --reload`""

Write-Host "All services are starting up in separate windows!"
