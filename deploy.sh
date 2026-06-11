#!/bin/bash

# Shopiators Companion App Deploy & Preview Utility (Shell Script / Git Bash)
# This script automates git updates and pushes the preview to your connected USB Android device.

# Colors for premium console styling
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}--------------------------------------------------------${NC}"
echo -e "${CYAN}  Shopiators Auto-Deploy & USB Preview Tool${NC}"
echo -e "${CYAN}--------------------------------------------------------${NC}"

# 1. Environment Configurations
export ANDROID_HOME="C:/Users/Lenovo/AndroidSDK"
export JAVA_HOME="C:/Program Files/Microsoft/jdk-17.0.19.10-hotspot"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

# 2. Git Automation
echo -e "${YELLOW}[Git] Scanning for local code changes...${NC}"
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}[Git] No local changes detected. Skipping git commit.${NC}"
else
    read -p "Enter commit message [Default: 'Auto-update: Mobile shell optimization']: " commitMsg
    if [ -z "$commitMsg" ]; then
        commitMsg="Auto-update: Mobile shell optimization"
    fi

    echo -e "${YELLOW}[Git] Adding changes...${NC}"
    git add .
    
    echo -e "${YELLOW}[Git] Committing changes: '$commitMsg'...${NC}"
    git commit -m "$commitMsg"
    
    echo -e "${YELLOW}[Git] Pushing changes to remote repository...${NC}"
    git push
    echo -e "${GREEN}[Git] Successfully updated remote git repository!${NC}"
fi

echo ""

# 3. USB Device Detection
echo -e "${YELLOW}[USB] Scanning for connected Android devices via ADB...${NC}"
# adb devices outputs a list; check if there are device lines beside the header
devices=$(adb devices | grep -v "List of devices" | grep "device")

if [ -z "$devices" ]; then
    echo -e "${RED}[USB] No active USB Android devices detected.${NC}"
    echo -e "${YELLOW}[USB] To preview changes, connect your phone via USB with USB Debugging enabled.${NC}"
else
    echo -e "${GREEN}[USB] Active USB Device detected! Pushing updated build for preview...${NC}"
    echo -e "${YELLOW}[USB] Starting Metro packager & native Android installer on port 8085...${NC}"
    npx expo run:android --port 8085
fi

echo -e "${CYAN}--------------------------------------------------------${NC}"
echo -e "${CYAN}  Deploy & Preview Task Complete!${NC}"
echo -e "${CYAN}--------------------------------------------------------${NC}"
