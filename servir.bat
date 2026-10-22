@echo off
rem Abre la demo en http://localhost:5174 (necesita Python instalado)
cd /d "%~dp0"
start "" http://localhost:5174
python -m http.server 5174
