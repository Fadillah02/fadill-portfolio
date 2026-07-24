# GAS Backend Setup Guide

## Overview

This project uses **Google Apps Script (GAS)** as a free backend for the GitHub Pages portfolio.

```
GitHub Pages (Frontend) → fetch() → GAS Web App (Backend) → Google Sheets (Database)
```

## Quick Start

### 1. Install clasp

```bash
npm install -g @google/clasp
clasp login
```

### 2. Create GAS Project

```bash
cd gas-backend
clasp create --title "AI Prompt Backend" --type standalone
```

### 3. Push Code to GAS

```bash
clasp push
```

### 4. Deploy as Web App

1. Go to https://script.google.com
2. Open your project
3. Click **Deploy** → **New deployment**
4. Select type: **Web app**
5. Execute as: **Me**
6. Who has access: **Anyone**
7. Click **Deploy**
8. Copy the Web App URL

### 5. Update Configuration

#### In `gas-backend/Code.gs`:
```javascript
const CONFIG = {
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID', // From Google Sheets URL
  SHEET_NAME: 'Prompts',
  STATS_SHEET: 'Stats'
};
```

#### In `js/gas-connector.js`:
```javascript
const GAS_CONFIG = {
  URL: 'YOUR_GAS_WEB_APP_URL' // From deployment
};
```

### 6. Setup Google Sheets

1. Create new Google Sheet
2. Copy Sheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```
3. Share sheet with your Google account (owner)

## File Structure

```
fadill-portfolio/
├── gas-backend/
│   ├── .clasp.json          # clasp config
│   ├── appsscript.json      # GAS manifest
│   └── Code.gs              # Backend code
├── js/
│   └── gas-connector.js     # Frontend connector
├── .github/
│   └── workflows/
│       └── deploy-gas.yml   # Auto-deploy workflow
├── package.json
└── setup-gas.sh             # Setup script
```

## API Reference

### GET Requests

| Action | Description | Parameters |
|--------|-------------|------------|
| `getPrompts` | Get all prompts | `category`, `orientation`, `sortBy`, `page`, `limit` |
| `getPrompt` | Get single prompt | `id` |
| `getCategories` | Get all categories | - |
| `getStats` | Get statistics | - |
| `search` | Search prompts | `q` |
| `getPopular` | Get popular prompts | `limit` |

### POST Requests

| Action | Description | Body |
|--------|-------------|------|
| `savePrompt` | Save new prompt | `title`, `prompt`, `category`, etc. |
| `likePrompt` | Like a prompt | `id` |
| `trackVisit` | Track page visit | `page`, `referrer`, etc. |
| `submitPrompt` | Submit for review | `title`, `prompt`, `authorName`, etc. |

## Usage Examples

### JavaScript (Frontend)

```javascript
// Load prompts
const result = await fetchPrompts({ category: 'Anime', limit: 10 });
console.log(result.data);

// Save prompt
await savePrompt({
  title: 'My Prompt',
  prompt: 'A beautiful landscape...',
  category: 'Nature'
});

// Search
const searchResult = await searchPrompts('cyberpunk');
```

### HTML

```html
<script src="js/gas-connector.js"></script>
<script>
  // Load prompts on page load
  document.addEventListener('DOMContentLoaded', async () => {
    const result = await fetchPrompts();
    renderPrompts(result.data, document.getElementById('prompts'));
  });
</script>
```

## GitHub Actions Auto-Deploy

The workflow `.github/workflows/deploy-gas.yml` will:

1. Trigger on push to `main` branch
2. Install clasp
3. Setup credentials from GitHub Secrets
4. Push code to GAS

### Setup GitHub Secrets

1. Go to your GitHub repo
2. Settings → Secrets and variables → Actions
3. Add new secret:
   - Name: `CLASP_CREDENTIALS`
   - Value: Content of `~/.clasp/credentials.json`

## Troubleshooting

### "Script ID not found"
- Make sure you ran `clasp create` first
- Check `.clasp.json` has correct script ID

### "Unauthorized" error
- Run `clasp login` again
- Check GitHub Secrets has correct credentials

### "Sheet not found"
- Make sure Sheet ID is correct in `Code.gs`
- Share the sheet with your Google account

### CORS error
- Use JSONP: `GAS_CONFIG.JSONP = true`
- Or deploy GAS with "Execute as: Me" and "Who has access: Anyone"

## Limits

| Feature | Limit |
|---------|-------|
| GAS execution | 6 min/request |
| GAS daily | 90 min total |
| URL Fetch | 20,000/day |
| Sheets API | 60,000/day |
| GitHub Actions | 2,000 min/month |
