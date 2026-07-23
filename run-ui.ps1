# PowerShell script to run both Vite UI servers

Write-Host "Starting Client Network Frontend on port 5173..."
Start-Process powershell -ArgumentList "-NoExit -Command `"cd client-network/frontend; npm run dev -- --port 5173`""

Write-Host "Starting Company Network Frontend on port 5174..."
Start-Process powershell -ArgumentList "-NoExit -Command `"cd company-network/frontend; npm run dev -- --port 5174`""

Write-Host "Both UI servers are starting up in separate windows!"
