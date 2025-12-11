@echo off
title Windows 11 Activator & cls & (net session >nul 2>&1)
if %errorLevel% GTR 0 (
    echo.
    echo Activation cannot continue. Please run CMD as Administrator...
    echo.
    goto halt
)

echo =====================================================================================
echo Windows 11 Activator
echo =====================================================================================
echo.
echo #Supported products:
echo - Windows 11 Home
echo - Windows 11 Pro
echo - Windows 11 Education
echo - Windows 11 Enterprise
echo.
echo.
echo =====================================================================================
echo Windows 11 activation in progress, please wait...
echo =====================================================================================

(cscript //nologo slmgr.vbs /ckms >nul || goto wshdisabled)
cscript //nologo slmgr.vbs /upk >nul
cscript //nologo slmgr.vbs /cpky >nul
set i=1

:: --- Detect OS edition using systeminfo instead of wmic ---
for /f "tokens=2,*" %%a in ('systeminfo ^| findstr /B /C:"OS Name"') do set OSNAME=%%b

echo Detected: %OSNAME%

echo %OSNAME% | findstr /I "Enterprise" >nul
if %errorlevel% EQU 0 (
    cscript //nologo slmgr.vbs /ipk NPPR9-FWDCX-D2C8J-H872K-2YT43 >nul || cscript //nologo slmgr.vbs /ipk DPH2V-TTNVB-4X9Q3-TJR4H-KHJW4 >nul || cscript //nologo slmgr.vbs /ipk YYVX9-NTFWV-6MDM3-9PT4T-4M68B >nul || cscript //nologo slmgr.vbs /ipk 44RPN-FTY23-9VTTB-MP9BX-T84FV >nul || cscript //nologo slmgr.vbs /ipk WNMTR-4C88C-JK8YV-HQ7T2-76DF9 >nul || cscript //nologo slmgr.vbs /ipk 2F77B-TNFGY-69QQF-B8YKP-D69TJ >nul || cscript //nologo slmgr.vbs /ipk DCPHK-NFMTC-H88MJ-PFHPY-QJ4BJ >nul || cscript //nologo slmgr.vbs /ipk QFFDN-GRT3P-VKWWX-X7T3R-8B639 >nul || cscript //nologo slmgr.vbs /ipk M7XTQ-FN8P6-TTKYV-9D4CC-J462D >nul || cscript //nologo slmgr.vbs /ipk 92NFX-8DJQP-P6BBQ-THF9C-7CG2H >nul
    goto skms
)

echo %OSNAME% | findstr /I "Home" >nul
if %errorlevel% EQU 0 (
    cscript //nologo slmgr.vbs /ipk TX9XD-98N7V-6WMQ6-BX7FG-H8Q99 >nul || cscript //nologo slmgr.vbs /ipk 3KHY7-WNT83-DGQKR-F7HPR-844BM >nul || cscript //nologo slmgr.vbs /ipk 7HNRX-D7KGG-3K4RQ-4WPJ4-YTDFH >nul || cscript //nologo slmgr.vbs /ipk PVMJN-6DFY6-9CCP6-7BKTT-D3WVR >nul
    goto skms
)

echo %OSNAME% | findstr /I "Education" >nul
if %errorlevel% EQU 0 (
    cscript //nologo slmgr.vbs /ipk NW6C2-QMPVW-D7KKK-3GKT6-VCFB2 >nul || cscript //nologo slmgr.vbs /ipk 2WH4N-8QGBV-H22JP-CT43Q-MDWWJ >nul
    goto skms
)

echo %OSNAME% | findstr /I "Pro" >nul
if %errorlevel% EQU 0 (
    cscript //nologo slmgr.vbs /ipk W269N-WFGWX-YVC9B-4J6C9-T83GX >nul || cscript //nologo slmgr.vbs /ipk MH37W-N47XK-V7XM9-C7227-GCQG9 >nul || cscript //nologo slmgr.vbs /ipk NRG8B-VKK3Q-CXVCJ-9G2XF-6Q84J >nul || cscript //nologo slmgr.vbs /ipk 9FNHH-K3HBT-3W4TD-6383H-6XYWF >nul || cscript //nologo slmgr.vbs /ipk 6TP4R-GNPTD-KYYHQ-7B7DP-J447Y >nul || cscript //nologo slmgr.vbs /ipk YVWGF-BXNMC-HTQYQ-CPQ99-66QFC >nul
    goto skms
)

goto notsupported

:skms
if %i% GTR 8 (goto busy) else if %i% LEQ 5 (set KMS=s1.mshost.pro) else if %i% LEQ 8 (set KMS=e8.us.to)
cscript //nologo slmgr.vbs /skms %KMS%:1688 >nul

:ato
echo.
echo =====================================================================================
echo.
cscript //nologo slmgr.vbs /ato | find /i "successfully" && (
    echo.
    echo =====================================================================================
    echo.
    echo.
    echo Support us with donations via saweria.co/R3verseNinja so this method can continue to be used.
    echo.
    if errorlevel 2 exit
) || (
    echo This may take a little longer, please wait...
    echo.
    echo.
    set /a i+=1
    timeout /t 10 >nul
    goto skms
)
timeout /t 7 >nul
explorer "https://saweria.co/R3verseNinja"
echo.
echo Support me with donate
echo.
goto halt

:notsupported
echo =====================================================================================
echo.
echo Unfortunately, your Windows 11 version isn’t supported.
echo.
goto halt

:wshdisabled
echo =====================================================================================
echo.
echo Activation failed: Windows Script Host access is currently disabled.
echo.
echo The recommended solution is to follow the tutorial video provided, which guides you through enabling Windows Script.
echo.
timeout /t 7 >nul
explorer "https://www.youtube.com/watch?v=q09lMEZwA5Y"
goto halt

:busy
echo =====================================================================================
echo.
echo Activation failed: your internet connection is not stable.
echo.
echo Please connect to a different network and try again.
echo.
goto halt

:halt
cd %~dp0 & del %0 >nul & pause >nul


