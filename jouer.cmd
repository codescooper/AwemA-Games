@echo off
rem ============================================================
rem  AwemA — lance la plateforme en local (le Village).
rem  Double-clique ce fichier. Une fenetre noire s'ouvre (le
rem  serveur) et ton navigateur ouvre http://127.0.0.1:8780/
rem  Pour arreter : ferme la fenetre noire.
rem ============================================================
title AwemA - serveur local (ne pas fermer pour continuer a jouer)
echo.
echo   AwemA tourne sur :  http://127.0.0.1:8780/
echo   (ouverture du navigateur...)  Ferme cette fenetre pour arreter.
echo.
start "" "http://127.0.0.1:8780/"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0engine\server.ps1" -Port 8780
