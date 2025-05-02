@echo off
setlocal enabledelayedexpansion

echo ===========================================
echo Construction de l'APK Android avec une approche alternative
echo ===========================================
echo.

set "PROJECT_DIR=%~dp0"
set "APK_OUTPUT_DIR=%PROJECT_DIR%apk"
set "GRADLE_PROPS=%PROJECT_DIR%android\gradle.properties"

echo [1/5] Preparation de l'environnement...
if not exist "%APK_OUTPUT_DIR%" mkdir "%APK_OUTPUT_DIR%" 2>nul

echo [2/5] Generation du bundle JavaScript...
call "%PROJECT_DIR%generate-bundle.bat"
if !ERRORLEVEL! neq 0 (
    echo [ERREUR] Echec de la generation du bundle.
    exit /b 1
)

echo [3/5] Optimisation de la configuration Gradle...
echo # Personnalisation des parametres Gradle pour eviter les problemes > "%GRADLE_PROPS%.new"
echo # Generation manuelle pour KSmall >> "%GRADLE_PROPS%.new"
echo. >> "%GRADLE_PROPS%.new"
echo # Properties existantes >> "%GRADLE_PROPS%.new"
type "%GRADLE_PROPS%" >> "%GRADLE_PROPS%.new"
echo. >> "%GRADLE_PROPS%.new"
echo # Optimisations supplementaires >> "%GRADLE_PROPS%.new"
echo org.gradle.daemon=false >> "%GRADLE_PROPS%.new"
echo org.gradle.parallel=false >> "%GRADLE_PROPS%.new"
echo org.gradle.configureondemand=false >> "%GRADLE_PROPS%.new"
echo org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError >> "%GRADLE_PROPS%.new"
echo org.gradle.offline=true >> "%GRADLE_PROPS%.new"
echo android.useAndroidX=true >> "%GRADLE_PROPS%.new"
echo android.enableJetifier=true >> "%GRADLE_PROPS%.new"
echo android.disableAutomaticComponentCreation=true >> "%GRADLE_PROPS%.new"
echo reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64 >> "%GRADLE_PROPS%.new"
move /y "%GRADLE_PROPS%.new" "%GRADLE_PROPS%" > nul

echo [4/5] Compilation avec parametres simplifies...
cd "%PROJECT_DIR%android"

echo Execution de Gradle avec des options simplifiees...
call gradlew --no-daemon --offline assembleRelease -x lint -x lintVitalRelease

if !ERRORLEVEL! neq 0 (
    cd "%PROJECT_DIR%"
    echo.
    echo [ERREUR] Echec de la compilation avec Gradle.
    echo.
    echo ===========================================
    echo SOLUTION ALTERNATIVE: Utiliser Android Studio
    echo ===========================================
    echo.
    echo Puisque la compilation en ligne de commande echoue, essayez de:
    echo 1. Ouvrir le dossier 'android' avec Android Studio
    echo 2. Laisser Android Studio synchroniser le projet
    echo 3. Selectionner 'Build' -^> 'Build Bundle(s) / APK(s)' -^> 'Build APK(s)'
    echo 4. L'APK sera genere dans android/app/build/outputs/apk/
    echo.
    exit /b 1
)

cd "%PROJECT_DIR%"

echo [5/5] Finalisation et deplacement de l'APK...
if exist "%PROJECT_DIR%android\app\build\outputs\apk\release\app-release.apk" (
    copy "%PROJECT_DIR%android\app\build\outputs\apk\release\app-release.apk" "%APK_OUTPUT_DIR%\ksmall-release.apk" > nul
    echo.
    echo ===========================================
    echo APK genere avec succes!
    echo Vous pouvez trouver l'APK dans le dossier: %APK_OUTPUT_DIR%\ksmall-release.apk
    echo ===========================================
) else (
    echo [AVERTISSEMENT] L'APK n'a pas ete genere a l'emplacement attendu.
    echo Veuillez verifier manuellement le dossier android\app\build\outputs\apk\
)

endlocal