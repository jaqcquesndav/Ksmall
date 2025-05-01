@echo off
echo ===========================================
echo Génération simplifiée de l'APK Android (Méthode alternative)
echo ===========================================
echo.

echo [1/4] Vérification de l'environnement...
cd %~dp0

echo [2/4] Préparation du bundle JavaScript...
if not exist android\app\src\main\assets mkdir android\app\src\main\assets
call node node_modules\react-native\cli.js bundle --platform android --dev false --entry-file index.js --bundle-output android\app\src\main\assets\index.android.bundle --assets-dest android\app\src\main\res

if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Échec de la génération du bundle JavaScript.
    goto :error
)

echo [3/4] Installation du package react-native...
call npm install react-native --no-save
if %ERRORLEVEL% neq 0 goto :error

echo [4/4] Construction directe avec React Native CLI...
call node node_modules\react-native\cli.js build-android --mode=release

if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Échec de la construction avec React Native CLI.
    goto :error
)

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