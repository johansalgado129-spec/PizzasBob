@echo off
title Vista previa Pizza's Bob
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel%==0 goto conpy
where python >nul 2>&1
if %errorlevel%==0 goto conpython
echo Para abrir la vista previa instala Python o usa VS Code con Live Server.
echo El sitio puede publicarse directamente en GitHub Pages.
pause
exit /b 1

:conpy
echo Iniciando el menu en http://localhost:8000
start "" "http://localhost:8000/"
py -m http.server 8000
exit /b

:conpython
echo Iniciando el menu en http://localhost:8000
start "" "http://localhost:8000/"
python -m http.server 8000
