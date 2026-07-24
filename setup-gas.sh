#!/bin/bash
# ============================================
# GAS Backend Setup Script
# ============================================
# Run this after you get your Google credentials

echo "========================================="
echo "  GAS Backend Setup"
echo "========================================="
echo ""

# Check if clasp is installed
if ! command -v clasp &> /dev/null; then
    echo "[1/6] Installing clasp..."
    npm install -g @google/clasp
else
    echo "[1/6] clasp already installed"
fi

# Login to Google
echo ""
echo "[2/6] Login to Google Apps Script..."
echo "A browser window will open. Please login."
clasp login

# Create GAS project
echo ""
echo "[3/6] Creating GAS project..."
cd gas-backend
clasp create --title "AI Prompt Backend" --type standalone

# Get script ID
echo ""
echo "[4/6] Getting Script ID..."
SCRIPT_ID=$(cat .clasp.json | grep -o '"scriptId": "[^"]*"' | cut -d'"' -f4)
echo "Script ID: $SCRIPT_ID"
echo ""
echo "IMPORTANT: Save this Script ID!"
echo "You'll need it for Google Sheet setup."

# Setup credentials for GitHub
echo ""
echo "[5/6] Setting up GitHub credentials..."
CREDENTIALS=$(cat ~/.clasp/credentials.json)
echo ""
echo "Copy the following to GitHub Secrets (name: CLASP_CREDENTIALS):"
echo "----------------------------------------"
echo "$CREDENTIALS"
echo "----------------------------------------"

# Initial push
echo ""
echo "[6/6] Initial push to GAS..."
clasp push

echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Go to https://script.google.com"
echo "2. Open the project: AI Prompt Backend"
echo "3. Deploy as Web App"
echo "4. Copy the Web App URL"
echo "5. Update js/gas-connector.js with the URL"
echo "6. Create Google Sheet and get Sheet ID"
echo "7. Update gas-backend/Code.gs with Sheet ID"
echo ""
echo "Google Sheet Setup:"
echo "1. Create new Google Sheet"
echo "2. Copy Sheet ID from URL"
echo "3. Share sheet with your Google account"
echo ""
