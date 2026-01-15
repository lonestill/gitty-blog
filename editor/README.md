# Gitty Editor

Electron-based editor for writing and publishing blog posts.

## Installation

```bash
cd editor
npm install
```

## Usage

```bash
npm start
```

Or from project root:
```bash
npm run editor
```

## Features

- 📝 Markdown editor with live preview
- 💾 Auto-save every 30 seconds
- 📤 Upload posts directly to GitHub
- ⚙️ Settings for GitHub repository and token
- 📋 List of all posts
- 🎨 Dark AMOLED theme matching the blog

## Setup

1. Open Settings (gear icon)
2. Enter your GitHub repository (format: `owner/repo`)
3. Enter your GitHub personal access token
   - Required scopes: `repo` (for uploading files)
   - Optional scope: `actions:write` (for automatic workflow trigger after API upload)
   - Note: If using git push (default), `actions:write` is not needed
4. Click Save

## Keyboard Shortcuts

- `Ctrl/Cmd + S` - Save post locally
