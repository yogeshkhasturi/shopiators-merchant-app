# Shopiators Companion App Deploy & Preview Utility
# This script automates git updates and pushes the preview to your connected USB Android device.

# 1. Environment Configurations
$ANDROID_SDK_PATH = "C:\Users\Lenovo\AndroidSDK"
$JAVA_HOME_PATH = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"

$env:ANDROID_HOME = $ANDROID_SDK_PATH
$env:JAVA_HOME = $JAVA_HOME_PATH
$env:Path = "$JAVA_HOME_PATH\bin;$ANDROID_SDK_PATH\platform-tools;" + $env:Path

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  Shopiators Auto-Deploy & USB Preview Tool" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

# 2. Git Automation
Write-Host "[Git] Scanning for local code changes..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($null -eq $gitStatus -or $gitStatus.Length -eq 0) {
    Write-Host "[Git] No local changes detected. Skipping git commit." -ForegroundColor Green
} else {
    $commitMsg = Read-Host "Enter commit message [Default: 'Auto-update: Mobile shell optimization']"
    if ([string]::IsNullOrWhiteSpace($commitMsg)) {
        $commitMsg = "Auto-update: Mobile shell optimization"
    }

    Write-Host "[Git] Adding changes..." -ForegroundColor Yellow
    git add .
    
    Write-Host "[Git] Committing changes: '$commitMsg'..." -ForegroundColor Yellow
    git commit -m $commitMsg
    
    Write-Host "[Git] Pushing changes to remote repository..." -ForegroundColor Yellow
    git push
    Write-Host "[Git] Successfully updated remote git repository!" -ForegroundColor Green
}

Write-Host ""

# 3. USB Device Detection
Write-Host "[USB] Scanning for connected Android devices via ADB..." -ForegroundColor Yellow
$adbDevices = adb devices
$deviceList = $adbDevices | Select-String -Pattern "\bdevice\b"

if ($null -eq $deviceList -or $deviceList.Count -eq 0) {
    Write-Host "[USB] No active USB Android devices detected." -ForegroundColor Red
    Write-Host "[USB] To preview changes, connect your phone via USB with USB Debugging enabled." -ForegroundColor Yellow
} else {
    Write-Host "[USB] Active USB Device detected! Pushing updated build for preview..." -ForegroundColor Green
    Write-Host "[USB] Starting Metro packager & native Android installer on port 8085..." -ForegroundColor Yellow
    npx expo run:android --port 8085
}

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  Deploy & Preview Task Complete!" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
