const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
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

ipcMain.handle('upload-post', async (event, { filename, token, repo, branch = 'main' }) => {
  try {
    if (!token || !repo) {
      return { success: false, error: 'GitHub token and repository are required' };
    }

    const filePath = path.join(contentDir, filename);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const base64Content = Buffer.from(content, 'utf-8').toString('base64');

    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      return { success: false, error: 'Invalid repository format. Use owner/repo' };
    }

    const octokit = new Octokit({ auth: token });
    const targetPath = `content/${filename}`;

    // Check if file exists
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
