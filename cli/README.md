# Gitty CLI

CLI tool for uploading markdown files to your GitHub repository.

## Installation

The CLI tool is part of the main project. Install dependencies:

```bash
npm install
```

## Usage

```bash
node cli/upload.js <file-path> [options]
```

### Options

- `--repo <owner/repo>` - GitHub repository (e.g., `username/repo-name`)
  - Default: `GITHUB_REPOSITORY` env var or from package.json
- `--token <token>` - GitHub personal access token
  - Default: `GITHUB_TOKEN` env var
- `--branch <branch>` - Branch to commit to (default: `main`)
- `--message <message>` - Custom commit message
  - Default: Auto-generated based on whether file is new or updated

### Examples

```bash
# Upload a post (requires GITHUB_TOKEN env var)
node cli/upload.js my-post.md --repo myuser/gitty

# Upload with explicit token
node cli/upload.js content/new-post.md --token ghp_xxx --repo myuser/gitty

# Upload to specific branch with custom message
node cli/upload.js post.md --branch main --message "Add new blog post" --repo myuser/gitty
```

### GitHub Token

You need a GitHub Personal Access Token with `repo` scope to upload files.

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` scope
3. Use it via `--token` flag or `GITHUB_TOKEN` environment variable

## How it works

1. Reads the local markdown file
2. Encodes it to Base64
3. Checks if the file already exists in the repository
4. Creates or updates the file in the `/content` folder via GitHub API
5. Commits the change to the specified branch
