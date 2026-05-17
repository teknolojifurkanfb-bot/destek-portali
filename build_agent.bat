@echo off
echo BullBase Agent - EXE Builder
echo ==============================
echo.

REM PyInstaller kurulu mu kontrol et
python -c "import PyInstaller" 2>nul
if errorlevel 1 (
    echo PyInstaller kuruluyor...
    pip install pyinstaller requests
)

echo EXE olusturuluyor...
pyinstaller --onefile --noconsole --name "BullBaseAgent" bullbase_agent.py

echo.
echo Tamamlandi! dist\BullBaseAgent.exe dosyasini PC lere kurun.
pause
