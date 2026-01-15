const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { Octokit } = require('@octokit/rest');

let mainWindow;
let contentDir = path.join(__dirname, '..', 'content');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in dev mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-posts', async () => {
  try {
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }
    
    const files = fs.readdirSync(contentDir)
      .filter(f => f.endsWith('.md'))
      .map(f => {
        const filePath = path.join(contentDir, f);
        const content = fs.readFileSync(filePath, 'utf-8');
        return {
          filename: f,
          path: filePath,
          content: content
        };
      });
    
    return { success: true, posts: files };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-post', async (event, { filename, content }) => {
  try {
    const filePath = path.join(contentDir, filename);
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-post', async (event, filename) => {
  try {
    const filePath = path.join(contentDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, error: 'File not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('upload-post', async (event, { filename, token, repo, branch = 'main', useGit = true }) => {
  try {
    if (!token || !repo) {
      return { success: false, error: 'GitHub token and repository are required' };
    }

    const filePath = path.join(contentDir, filename);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    // Use git commands if useGit is true
    if (useGit) {
      try {
        const repoRoot = path.join(__dirname, '..');
        
        // Check if it's a git repo
        try {
          execSync('git rev-parse --git-dir', { cwd: repoRoot, stdio: 'ignore' });
        } catch {
          return { success: false, error: 'Not a git repository. Initialize with: git init' };
        }

        // Configure git with token
        const remoteUrl = `https://${token}@github.com/${repo}.git`;
        
        // Set remote if not exists or update it
        try {
          execSync('git remote get-url origin', { cwd: repoRoot, stdio: 'ignore' });
          execSync(`git remote set-url origin ${remoteUrl}`, { cwd: repoRoot, stdio: 'ignore' });
        } catch {
          execSync(`git remote add origin ${remoteUrl}`, { cwd: repoRoot, stdio: 'ignore' });
        }

        // Configure git user if not set (required for commits)
        try {
          execSync('git config user.name', { cwd: repoRoot, stdio: 'ignore' });
        } catch {
          // Extract username from repo (owner)
          const [owner] = repo.split('/');
          execSync(`git config user.name "${owner}"`, { cwd: repoRoot, stdio: 'ignore' });
        }
        
        try {
          execSync('git config user.email', { cwd: repoRoot, stdio: 'ignore' });
        } catch {
          // Set a default email (GitHub allows this format)
          const [owner] = repo.split('/');
          execSync(`git config user.email "${owner}@users.noreply.github.com"`, { cwd: repoRoot, stdio: 'ignore' });
        }

        // Pull latest changes first to avoid conflicts
        try {
          execSync(`git pull origin ${branch} --no-edit`, { cwd: repoRoot, stdio: 'pipe' });
        } catch (pullError) {
          // If pull fails, try to handle untracked files and pull again
          try {
            // Add all untracked files first
            try {
              execSync('git add -A', { cwd: repoRoot, stdio: 'pipe' });
            } catch {}
            
            // Stash all changes (including staged)
            execSync('git stash push -u -m "Auto-stash before pull"', { cwd: repoRoot, stdio: 'pipe' });
            
            // Now pull should work
            execSync(`git pull origin ${branch} --no-edit`, { cwd: repoRoot, stdio: 'pipe' });
            
            // Restore stashed changes
            execSync('git stash pop', { cwd: repoRoot, stdio: 'pipe' });
          } catch (stashError) {
            console.warn('Failed to pull/stash:', stashError.message);
            // Try pull with rebase as last resort
            try {
              execSync(`git pull --rebase origin ${branch} --no-edit`, { cwd: repoRoot, stdio: 'pipe' });
            } catch (rebaseError) {
              console.warn('Failed to pull with rebase:', rebaseError.message);
              // Continue anyway - might be able to push after commit
            }
          }
        }

        // Generate posts.json before committing
        try {
          const { generateIndex } = require('../scripts/generate-index.js');
          generateIndex();
        } catch (genError) {
          console.warn('Failed to generate posts.json:', genError.message);
        }
        
        // Add all changed files to staging (includes post.md and posts.json)
        try {
          execSync('git add .', { cwd: repoRoot, stdio: 'pipe' });
          console.log('Added all changed files to staging');
        } catch (addError) {
          throw new Error(`Failed to add files: ${addError.message}`);
        }
        
        // Check if there are any staged changes to commit (after git add)
        let hasStagedChanges = false;
        try {
          const stagedStatus = execSync('git diff --cached --name-only', { cwd: repoRoot, encoding: 'utf-8' });
          hasStagedChanges = stagedStatus.trim().length > 0;
        } catch {
          // If check fails, try alternative method
          try {
            const status = execSync('git status --porcelain', { cwd: repoRoot, encoding: 'utf-8' });
            // Check for staged files (lines starting with A, M, D, R, C)
            hasStagedChanges = status.split('\n').some(line => /^[AMDRC]/.test(line.trim()));
          } catch {
            hasStagedChanges = false;
          }
        }
        
        if (!hasStagedChanges) {
          console.log('No changes to commit - files are already up to date');
          return { success: true, message: 'No changes to commit - files are already up to date' };
        }
        
        // Commit
        const commitMessage = `Add/Update: ${filename}`;
        try {
          execSync(`git commit -m "${commitMessage}"`, { cwd: repoRoot, stdio: 'pipe' });
        } catch (commitError) {
          const errorMsg = commitError.message || commitError.toString();
          // Check if it's "nothing to commit" error
          if (errorMsg.includes('nothing to commit') || errorMsg.includes('no changes')) {
            return { success: true, message: 'No changes to commit' };
          }
          throw new Error(`Failed to commit: ${errorMsg}`);
        }
        
        // Push
        try {
          execSync(`git push origin ${branch}`, { cwd: repoRoot, stdio: 'pipe' });
        } catch (pushError) {
          const errorMsg = pushError.message || pushError.toString();
          
          // If push fails due to non-fast-forward, try pull with rebase and push again
          if (errorMsg.includes('non-fast-forward') || errorMsg.includes('behind')) {
            console.log('Push rejected, pulling with rebase and pushing again...');
            try {
              execSync(`git pull --rebase origin ${branch}`, { cwd: repoRoot, stdio: 'pipe' });
              // Try push again after rebase
              execSync(`git push origin ${branch}`, { cwd: repoRoot, stdio: 'pipe' });
              console.log('Successfully pushed after rebase');
            } catch (rebaseError) {
              throw new Error(`Failed to push after rebase: ${rebaseError.message}`);
            }
          } else {
            throw new Error(`Failed to push: ${errorMsg}`);
          }
        }
        
        return { success: true };
      } catch (error) {
        // Return error instead of silently falling back to API
        console.error('Git push failed:', error.message);
        return { success: false, error: `Git error: ${error.message}` };
      }
    }

    // Fallback to GitHub API
    const content = fs.readFileSync(filePath, 'utf-8');
    const base64Content = Buffer.from(content, 'utf-8').toString('base64');

    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      return { success: false, error: 'Invalid repository format. Use owner/repo' };
    }

    // Generate posts.json before uploading
    try {
      const { generateIndex } = require('../scripts/generate-index.js');
      generateIndex();
    } catch (genError) {
      console.warn('Failed to generate posts.json:', genError.message);
    }

    const octokit = new Octokit({ auth: token });
    const targetPath = `content/${filename}`;

    // Upload the post file
    let sha = null;
    try {
      const response = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path: targetPath,
        ref: branch
      });
      if (response.data && response.data.sha) {
        sha = response.data.sha;
      }
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: targetPath,
      message: sha ? `Update: ${filename}` : `Add: ${filename}`,
      content: base64Content,
      branch: branch,
      ...(sha && { sha })
    });

    // Upload posts.json
    const postsJsonPath = path.join(__dirname, '..', 'src', 'assets', 'posts.json');
    if (fs.existsSync(postsJsonPath)) {
      const postsJsonContent = fs.readFileSync(postsJsonPath, 'utf-8');
      const postsJsonBase64 = Buffer.from(postsJsonContent, 'utf-8').toString('base64');
      
      let postsJsonSha = null;
      try {
        const postsJsonResponse = await octokit.repos.getContent({
          owner,
          repo: repoName,
          path: 'src/assets/posts.json',
          ref: branch
        });
        if (postsJsonResponse.data && postsJsonResponse.data.sha) {
          postsJsonSha = postsJsonResponse.data.sha;
        }
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
      }

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo: repoName,
        path: 'src/assets/posts.json',
        message: `Update posts index`,
        content: postsJsonBase64,
        branch: branch,
        ...(postsJsonSha && { sha: postsJsonSha })
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('generate-index', async () => {
  try {
    const { generateIndex } = require('../scripts/generate-index.js');
    generateIndex();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-config', async () => {
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return { success: true, config };
    }
    return { success: true, config: {} };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    const configPath = path.join(__dirname, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
