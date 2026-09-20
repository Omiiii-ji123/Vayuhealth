@echo off
title VayuHealth - Application Starter
echo ========================================================
echo         VAYUHEALTH ENVIRONMENTAL INTELLIGENCE
echo ========================================================
echo.
echo [1/2] Starting Spring Boot Backend (Port 8081)...
start "VayuHealth Backend API" cmd /k "cd /d "%~dp0" && .\mvnw.cmd spring-boot:run"

echo.
echo [2/2] Starting React Vite Frontend (Port 5173)...
start "VayuHealth Frontend UI" cmd /k "cd /d "%~dp0vayuhealth" && npm run dev"

echo.
echo ========================================================
echo   Backend URL:   http://localhost:8081
echo   Frontend URL:  http://localhost:5173
echo ========================================================
echo.
echo Opening VayuHealth application in your default browser...
timeout /t 5 /nobreak >nul
start http://localhost:5173
echo.
echo Both services are running in background console windows.
echo To stop the application, simply close those console windows.
exit /b 0
