@echo off
title Daily Activity Tracker - Launcher
echo ===================================================
echo   Daily Activity Tracker - Starting Up
echo   Backend : Spring Boot + Supabase PostgreSQL
echo   Frontend: HTML5 / Bootstrap 5 (Offline)
echo ===================================================
echo.

REM Kill any stale java process on port 8080
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8080 2^>nul') DO (
    taskkill /PID %%P /F >nul 2>&1
)
timeout /t 1 /nobreak > nul

cd /d "%~dp0backend"

echo [1/3] Starting backend (Spring Boot on port 8080)...
start "" /B javaw -jar "target\activity-tracker-backend-0.0.1-SNAPSHOT.jar"

echo [2/3] Waiting for backend to initialize...
timeout /t 6 /nobreak > nul

echo [3/3] Opening frontend dashboard in browser...
start "" "%~dp0frontend\index.html"

echo.
echo ===================================================
echo   Done! App is running.
echo   Backend API: http://localhost:8080/api
echo   Frontend   : Opened in your browser
echo ===================================================
echo.
echo Press Ctrl+C or close this window to stop the backend.
pause > nul
