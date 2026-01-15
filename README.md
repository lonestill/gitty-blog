# Gitty

A GitHub Pages based blog platform built with Angular 17+ and markdown.

## Features

- 📝 Markdown-based content management
- 🚀 GitHub Pages deployment
- 🔍 Automatic post indexing
- 📦 Standalone Angular components
- 🔗 Hash-based routing for GitHub Pages

## Project Structure

```
gitty/
├── content/           # Markdown blog posts
├── scripts/           # Build-time scripts
│   └── generate-index.js
├── cli/              # CLI tools for content management
├── src/              # Angular application
│   ├── app/         # Application components
│   └── assets/      # Static assets (posts.json generated here)
└── .github/
    └── workflows/   # GitHub Actions workflows
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

1. Add markdown files to the `content/` directory with frontmatter:

```markdown
---
title: "My Post"
date: "2024-01-01"
author: "John Doe"
tags: ["angular", "blog"]
---

# My Post

Content here...
```

2. Generate the posts index:

```bash
npm run generate-index
```

3. Start the development server:

```bash
npm start
```

4. Open `http://localhost:4200` in your browser

### Building

```bash
npm run build
```

This will:
1. Generate the posts index from markdown files
2. Build the Angular application

## CLI Tool

The CLI tool (in `cli/`) allows you to upload markdown files directly to your GitHub repository via the GitHub API.

## GitHub Actions

The workflow in `.github/workflows/main.yml` automatically:
1. Runs the index generation script
2. Builds the Angular app
3. Deploys to the `gh-pages` branch

## License

MIT
