@echo off
title Initialize Ar Rahman Trust MySQL Database
echo ========================================================
echo   Initializing MySQL Database: ar_rahman_trust_db
echo ========================================================
echo.
cd /d "%~dp0\.."
node database/initDb.js
echo.
echo Database setup completed.
pause
