@echo off
if "%~1"=="-Command" (
    C:\Windows\System32\cmd.exe /c %2 %3 %4 %5 %6 %7 %8 %9
) else (
    C:\Windows\System32\cmd.exe /c %*
)
