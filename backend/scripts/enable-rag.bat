@echo off
REM 🚀 Enable RAG Recommendations Script (Windows)
REM 
REM This script enables RAG-enhanced recommendations globally
REM by updating .env file with required environment variables

setlocal enabledelayedexpansion

set ENV_FILE=.env
set ENV_LOCAL_FILE=.env.local

echo 🚀 Enabling RAG Recommendations...
echo.

REM Check which env file to use
if exist "%ENV_LOCAL_FILE%" (
    set TARGET_FILE=%ENV_LOCAL_FILE%
    echo 📝 Using .env.local file
) else if exist "%ENV_FILE%" (
    set TARGET_FILE=%ENV_FILE%
    echo 📝 Using .env file
) else (
    set TARGET_FILE=%ENV_FILE%
    echo 📝 Creating new .env file
)

echo.

REM Enable RAG recommendations
call :set_env_var "ENABLE_RAG_RECOMMENDATIONS" "true" "%TARGET_FILE%"
echo ✅ ENABLE_RAG_RECOMMENDATIONS=true

REM Optional: Enable ChromaDB
set /p enable_chromadb="Enable ChromaDB indexing for faster queries? (y/n) [n]: "
if /i "%enable_chromadb%"=="y" (
    call :set_env_var "USE_CHROMADB_FOR_RECOMMENDATIONS" "true" "%TARGET_FILE%"
    echo ✅ USE_CHROMADB_FOR_RECOMMENDATIONS=true
    
    findstr /C:"CHROMADB_URL=" "%TARGET_FILE%" >nul
    if errorlevel 1 (
        set /p chromadb_url="Enter ChromaDB URL [http://localhost:8000]: "
        if "!chromadb_url!"=="" set chromadb_url=http://localhost:8000
        call :set_env_var "CHROMADB_URL" "!chromadb_url!" "%TARGET_FILE%"
        echo ✅ CHROMADB_URL=!chromadb_url!
    )
) else (
    call :set_env_var "USE_CHROMADB_FOR_RECOMMENDATIONS" "false" "%TARGET_FILE%"
    echo ℹ️  USE_CHROMADB_FOR_RECOMMENDATIONS=false (using realtime embedding)
)

echo.
echo ✨ RAG Recommendations enabled!
echo.
echo 📋 Next steps:
echo   1. Restart your backend server
echo   2. Run initial sync: POST /api/rag/sync/jobs
echo   3. Monitor metrics: GET /api/rag/metrics
echo.
echo 📊 To view metrics dashboard, visit: /api/rag/metrics
echo.

endlocal
exit /b

:set_env_var
set key=%~1
set value=%~2
set file=%~3

findstr /C:"%key%=" "%file%" >nul
if errorlevel 1 (
    REM Add new variable
    echo. >> "%file%"
    echo %key%=%value% >> "%file%"
) else (
    REM Update existing variable
    powershell -Command "(Get-Content '%file%') -replace '^%key%=.*', '%key%=%value%' | Set-Content '%file%'"
)

exit /b

