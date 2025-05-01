@echo off
echo ===========================================
echo Génération de l'APK Android pour KSmall
echo ===========================================
echo.

echo [1/5] Vérification des prérequis...
cd %~dp0
if not exist android\gradlew.bat (
    echo [ERREUR] Le fichier gradlew.bat est manquant dans le dossier android
    echo Assurez-vous d'être dans le bon répertoire du projet
    goto :error
)

echo [2/5] Installation des dépendances React Native...
call npm install --no-audit
if %ERRORLEVEL% neq 0 goto :error

echo [3/5] Préparation du bundle JavaScript...
if not exist android\app\src\main\assets\. mkdir android\app\src\main\assets
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android\app\src\main\assets\index.android.bundle --assets-dest android\app\src\main\res
if %ERRORLEVEL% neq 0 goto :error

echo [4/5] Nettoyage des builds précédents...
cd android
call gradlew.bat clean
if %ERRORLEVEL% neq 0 goto :error

echo [5/5] Génération de l'APK release...
call gradlew.bat assembleRelease
if %ERRORLEVEL% neq 0 goto :error

echo [Finition] Vérification et copie de l'APK...
if not exist app\build\outputs\apk\release\app-release.apk (
    echo [ERREUR] L'APK n'a pas été généré correctement
    goto :error
)

mkdir ..\apk 2>nul
copy app\build\outputs\apk\release\app-release.apk ..\apk\ksmall-release.apk
echo.
echo ===========================================
echo APK généré avec succès!
echo Vous pouvez trouver l'APK dans le dossier: apk\ksmall-release.apk
echo ===========================================
goto :end

:error
echo.
echo [ERREUR] La génération de l'APK a échoué.
exit /b 1

:end
cd ..
echo Construction terminée.