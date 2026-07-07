@echo off
echo ========================================================
echo Vercel Deployment for GrowEasy AI CSV Importer
echo ========================================================
echo.
echo 1. I will now open the Vercel CLI. 
echo 2. If it asks you to login, please do so.
echo 3. It will ask for the project name and whether to link it. Hit Enter for defaults!
echo.
cd groweasy-importer\frontend
npx vercel --prod
echo.
pause
