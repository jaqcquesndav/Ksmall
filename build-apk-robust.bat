@echo off
setlocal enabledelayedexpansion

echo ===========================================
echo Generation robuste de l'APK Android pour KSmall
echo ===========================================
echo.

set SUCCESS=0
set ERROR_COUNT=0
set MAX_RETRIES=3
set PROJECT_DIR=%~dp0
set APK_OUTPUT_DIR=%PROJECT_DIR%apk
set BUNDLE_DIR=%PROJECT_DIR%android\app\src\main\assets
set RESOURCES_DIR=%PROJECT_DIR%android\app\src\main\res

echo [1/6] Verification de l'environnement et des prerequisites...
cd %PROJECT_DIR%

if not exist node_modules (
    echo [ERREUR] Le dossier node_modules est manquant. Installation des dependances...
    call npm install
    if !ERRORLEVEL! neq 0 (
        echo [ERREUR] Echec de l'installation des dependances.
        goto :error
    )
)

echo [2/6] Nettoyage des fichiers temporaires et des builds precedents...
if exist %APK_OUTPUT_DIR% rd /s /q %APK_OUTPUT_DIR%
mkdir %APK_OUTPUT_DIR%

if exist %BUNDLE_DIR% rd /s /q %BUNDLE_DIR%
mkdir %BUNDLE_DIR%

cd %PROJECT_DIR%android
call gradlew clean
if !ERRORLEVEL! neq 0 (
    echo [AVERTISSEMENT] Le nettoyage Gradle a echoue, mais nous continuons...
)
cd %PROJECT_DIR%

echo [3/6] Installation des dependances specifiques...
call npm install --save-dev @react-native-community/cli-platform-android babel-plugin-transform-remove-console

echo [4/6] Preparation du bundle JavaScript...
echo import { AppRegistry } from 'react-native'; > %PROJECT_DIR%entrypoint-check.js
echo import App from './App'; >> %PROJECT_DIR%entrypoint-check.js
echo AppRegistry.registerComponent('ksmall', ^(^) =^> App^); >> %PROJECT_DIR%entrypoint-check.js

node -e "try { require('./entrypoint-check.js'); console.log('Entrypoint verification successful'); } catch (e) { console.error('Entrypoint verification failed:', e.message); process.exit(1); }"
if !ERRORLEVEL! neq 0 (
    echo [ERREUR] Verification du point d'entree a echoue. Verifiez votre fichier App.tsx ou App.js.
    del %PROJECT_DIR%entrypoint-check.js
    goto :error
)
del %PROJECT_DIR%entrypoint-check.js

echo [INFO] Generation du bundle JavaScript pour la production...
set RETRY_COUNT=0
:retry_bundle
set /a RETRY_COUNT+=1
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output %BUNDLE_DIR%\index.android.bundle --assets-dest %RESOURCES_DIR%
if !ERRORLEVEL! neq 0 (
    if !RETRY_COUNT! lss !MAX_RETRIES! (
        echo [AVERTISSEMENT] Echec de la generation du bundle JavaScript. Tentative !RETRY_COUNT!/!MAX_RETRIES!...
        goto :retry_bundle
    ) else (
        echo [ERREUR] Echec de la generation du bundle JavaScript apres !MAX_RETRIES! tentatives.
        goto :error
    )
)

echo [5/6] Construction de l'APK avec Gradle...
cd %PROJECT_DIR%android
set RETRY_COUNT=0
:retry_build
set /a RETRY_COUNT+=1
call gradlew assembleRelease --stacktrace
if !ERRORLEVEL! neq 0 (
    if !RETRY_COUNT! lss !MAX_RETRIES! (
        echo [AVERTISSEMENT] Echec de la construction de l'APK. Tentative !RETRY_COUNT!/!MAX_RETRIES!...
        goto :retry_build
    ) else (
        echo [ERREUR] Echec de la construction de l'APK apres !MAX_RETRIES! tentatives.
        goto :error
    )
)

echo [6/6] Finalisation et deplacement de l'APK...
if exist "%PROJECT_DIR%android\app\build\outputs\apk\release\app-release.apk" (
    copy "%PROJECT_DIR%android\app\build\outputs\apk\release\app-release.apk" "%APK_OUTPUT_DIR%\ksmall-release.apk"
    echo.
    echo ===========================================
    echo APK genere avec succes!
    echo Vous pouvez trouver l'APK dans le dossier: %APK_OUTPUT_DIR%\ksmall-release.apk
    echo ===========================================
    set SUCCESS=1
) else (
    echo [ERREUR] L'APK n'a pas ete genere a l'emplacement attendu.
    goto :error
)

goto :end

:error
set /a ERROR_COUNT+=1
echo.
echo [ERREUR] La generation de l'APK a echoue. (Erreur !ERROR_COUNT!)
if %ERROR_COUNT% lss %MAX_RETRIES% (
    echo [INFO] Nouvelle tentative avec une approche alternative...
    if %ERROR_COUNT% equ 1 (
        echo [TENTATIVE ALTERNATIVE] Installation des outils React Native...
        call npm install -g react-native-cli
        goto :retry_bundle
    ) else if %ERROR_COUNT% equ 2 (
        echo [TENTATIVE ALTERNATIVE] Utilisation d'une approche Expo...
        call npx expo prebuild -p android --clean
        goto :retry_bundle
    )
)
exit /b 1

:end
cd %PROJECT_DIR%
if %SUCCESS% equ 1 (
    echo Construction terminee avec succes.
) else (
    echo Construction terminee avec des erreurs.
    exit /b 1
)
endlocal