@echo off
setlocal

set "ROOT=%~dp0"
set "FRONTEND_DIR=%ROOT%frontend"

if not exist "%FRONTEND_DIR%\node_modules" (
  echo Installing frontend dependencies...
  pushd "%FRONTEND_DIR%"
  call npm install --legacy-peer-deps
  if errorlevel 1 (
    popd
    exit /b 1
  )
  popd
)

echo Starting the frontend.
start "MechaForgeLab Frontend" /D "%FRONTEND_DIR%" cmd /k npm run dev

echo The backend is handled by the Next.js API routes inside the frontend app.
echo The app will create its Python runtime on demand when you use the agent features.

endlocal