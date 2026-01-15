#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

/**
 * CLI tool to upload a markdown file to GitHub repository's /content folder
 * 
 * Usage: node cli/upload.js <file-path> [options]
 * 
 * Options:
 *   --repo <owner/repo>    GitHub repository (default: from package.json or env)
 *   --token <token>        GitHub personal access token (default: from GITHUB_TOKEN env)
 *   --branch <branch>      Branch to commit to (default: main)
 *   --message <message>    Commit message (default: auto-generated)
 */

const DEFAULT_BRANCH = 'main';
const DEFAULT_CONTENT_PATH = 'content';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    filePath: null,
    repo: process.env.GITHUB_REPOSITORY || null,
    token: process.env.GITHUB_TOKEN || null,
    branch: DEFAULT_BRANCH,
    message: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--repo' && args[i + 1]) {
      options.repo = args[++i];
    } else if (arg === '--token' && args[i + 1]) {
      options.token = args[++i];
    } else if (arg === '--branch' && args[i + 1]) {
      options.branch = args[++i];
    } else if (arg === '--message' && args[i + 1]) {
      options.message = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith('--') && !options.filePath) {
      options.filePath = arg;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Usage: node cli/upload.js <file-path> [options]

Upload a markdown file to GitHub repository's /content folder via API.

Arguments:
  file-path              Path to the markdown file to upload

Options:
  --repo <owner/repo>    GitHub repository (e.g., username/repo-name)
                         Default: GITHUB_REPOSITORY env var or from package.json
  --token <token>        GitHub personal access token
                         Default: GITHUB_TOKEN env var
  --branch <branch>      Branch to commit to (default: ${DEFAULT_BRANCH})
  --message <message>    Custom commit message
                         Default: "Add/Update: <filename>"
  --help, -h             Show this help message

Environment Variables:
  GITHUB_REPOSITORY      GitHub repository in format owner/repo
  GITHUB_TOKEN           GitHub personal access token

Examples:
  node cli/upload.js post.md --repo myuser/gitty
  node cli/upload.js content/new-post.md --branch main --message "Add new post"
  GITHUB_TOKEN=xxx node cli/upload.js post.md --repo myuser/gitty
`);
}

/**
 * Get repository info from package.json if available
 */
function getRepoFromPackage() {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      if (pkg.repository) {
        if (typeof pkg.repository === 'string') {
          return pkg.repository.replace(/^git\+https:\/\/github.com\//, '').replace(/\.git$/, '');
        } else if (pkg.repository.url) {
          return pkg.repository.url
            .replace(/^git\+https:\/\/github.com\//, '')
            .replace(/^https:\/\/github.com\//, '')
            .replace(/\.git$/, '');
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}

/**
 * Read and encode file to Base64
 */
function readAndEncodeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return Buffer.from(content, 'utf-8').toString('base64');
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

/**
 * Get file SHA if it already exists in the repository
 */
async function getFileSha(octokit, owner, repo, filePath, branch) {
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch
    });
    
    if (response.data && response.data.sha) {
      return response.data.sha;
    }
  } catch (error) {
    if (error.status === 404) {
      // File doesn't exist yet
      return null;
    }
    throw error;
  }
  return null;
}

/**
 * Upload file to GitHub
 */
async function uploadFile(options) {
  const { filePath, repo, token, branch, message } = options;

  // Validate inputs
  if (!filePath) {
    console.error('Error: File path is required');
    printHelp();
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  if (!filePath.endsWith('.md')) {
    console.error('Error: Only .md files are supported');
    process.exit(1);
  }

  if (!repo) {
    const repoFromPkg = getRepoFromPackage();
    if (repoFromPkg) {
      options.repo = repoFromPkg;
      console.log(`Using repository from package.json: ${repoFromPkg}`);
    } else {
      console.error('Error: Repository not specified. Use --repo or set GITHUB_REPOSITORY env var');
      process.exit(1);
    }
  }

  if (!token) {
    console.error('Error: GitHub token not specified. Use --token or set GITHUB_TOKEN env var');
    process.exit(1);
  }

  // Parse repository
  const [owner, repoName] = options.repo.split('/');
  if (!owner || !repoName) {
    console.error('Error: Invalid repository format. Use owner/repo');
    process.exit(1);
  }

  // Initialize Octokit
  const octokit = new Octokit({
    auth: token
  });

  // Determine target path in repository
  const fileName = path.basename(filePath);
  const targetPath = path.join(DEFAULT_CONTENT_PATH, fileName).replace(/\\/g, '/');

  // Read and encode file
  console.log(`Reading file: ${filePath}`);
  const content = readAndEncodeFile(filePath);

  // Check if file exists
  console.log(`Checking if file exists in repository: ${targetPath}`);
  const sha = await getFileSha(octokit, owner, repoName, targetPath, branch);

  // Generate commit message
  const commitMessage = message || (sha 
    ? `Update: ${fileName}` 
    : `Add: ${fileName}`);

  // Upload file
  console.log(`${sha ? 'Updating' : 'Creating'} file: ${targetPath}`);
  
  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: targetPath,
      message: commitMessage,
      content: content,
      branch: branch,
      ...(sha && { sha }) // Include SHA if updating existing file
    });

    console.log(`✓ Successfully ${sha ? 'updated' : 'created'} ${targetPath} on ${branch} branch`);
    console.log(`  Commit: ${commitMessage}`);
  } catch (error) {
    console.error('Error uploading file:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  uploadFile(options).catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { uploadFile };
