@echo off
echo Starting Client Network Backend on Port 8001...
python -m uvicorn main:app --reload --port 8001
pause
