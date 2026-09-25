@echo off
rem ver-sitio.bat - Abre TallaFacil en el navegador.
rem Doble clic en este archivo. Deja la ventana abierta mientras lo uses.
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   No se encuentra Node.js en este equipo.
  echo   Instalalo desde https://nodejs.org y vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)

rem Si las dependencias estan instaladas, recompila para ver los ultimos cambios.
rem Si no, muestra el sitio ya compilado que viene en la carpeta dist.
if exist "node_modules\@esbuild\win32-x64\package.json" (
  echo   Compilando el sitio...
  call npm run build >nul 2>nul
  if errorlevel 1 echo   No se pudo recompilar: se muestra la ultima version compilada.
)

node servidor.mjs --abrir

echo.
echo   El servidor se ha detenido.
pause
