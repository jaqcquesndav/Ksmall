@echo off
setlocal enabledelayedexpansion

echo ===========================================
echo Generation du bundle JavaScript seulement pour KSmall
echo ===========================================
echo.

set "PROJECT_DIR=%~dp0"
set "BUNDLE_DIR=%PROJECT_DIR%android\app\src\main\assets"
set "RESOURCES_DIR=%PROJECT_DIR%android\app\src\main\res"

echo [1/3] Creation des dossiers necessaires...
if not exist "%BUNDLE_DIR%" mkdir "%BUNDLE_DIR%" 2>nul
if not exist "%RESOURCES_DIR%" mkdir "%RESOURCES_DIR%" 2>nul

echo [2/3] Generation du bundle JavaScript...
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output "%BUNDLE_DIR%\index.android.bundle" --assets-dest "%RESOURCES_DIR%"

if !ERRORLEVEL! neq 0 (
    echo [ERREUR] Echec de la generation du bundle JavaScript.
    exit /b 1
) else (
    echo [SUCCES] Bundle JavaScript genere avec succes dans: %BUNDLE_DIR%\index.android.bundle
)

echo [3/3] Copie du bundle pour une utilisation externe...
mkdir "%PROJECT_DIR%output" 2>nul
copy "%BUNDLE_DIR%\index.android.bundle" "%PROJECT_DIR%output\index.android.bundle" >nul
xcopy /E /I /Y "%RESOURCES_DIR%" "%PROJECT_DIR%output\resources" >nul

echo.
echo ===========================================
echo Generation du bundle terminee avec succes!
echo Les fichiers sont disponibles dans le dossier: %PROJECT_DIR%output
echo ===========================================

endlocal