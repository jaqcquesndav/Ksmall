@echo off
echo ===========================================
echo Génération directe de l'APK Android avec Gradle
echo ===========================================
echo.

echo [1/3] Vérification de l'environnement...
cd %~dp0

echo [2/3] Préparation du bundle JavaScript...
if not exist android\app\src\main\assets mkdir android\app\src\main\assets
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android\app\src\main\assets\index.android.bundle --assets-dest android\app\src\main\res

if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Échec de la génération du bundle JavaScript.
    goto :error
)

echo [3/3] Construction directe avec Gradle...
cd android
call gradlew assembleRelease

if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Échec de la construction avec Gradle.
    cd ..
    goto :error
)

cd ..
echo [+] Recherche de l'APK généré...
if exist android\app\build\outputs\apk\release\app-release.apk (
    mkdir apk 2>nul
    copy android\app\build\outputs\apk\release\app-release.apk apk\ksmall-release.apk
    echo.
    echo ===========================================
    echo APK généré avec succès!
    echo Vous pouvez trouver l'APK dans le dossier: apk\ksmall-release.apk
    echo ===========================================
) else (
    echo [AVERTISSEMENT] L'APK n'a pas été trouvé à l'emplacement attendu.
    echo Veuillez vérifier manuellement le dossier android\app\build\outputs\apk\
)

goto :end

:error
echo.
echo [ERREUR] La génération de l'APK a échoué.
exit /b 1

:end
echo Construction terminée.