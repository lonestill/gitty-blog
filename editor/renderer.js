let currentPost = null;
let currentContent = '';
let isDirty = false;
let config = {};

// Parse frontmatter
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { data: {}, content: content };
  }
  
  const frontmatterText = match[1];
  const body = match[2];
  
  const data = {};
  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Parse arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
      }
      
      data[key] = value;
    }
  });
  
  return { data, content: body };
}

// Stringify frontmatter
function stringifyFrontmatter(data, content) {
  const frontmatter = Object.entries(data)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
      }
      return `${key}: ${typeof value === 'string' ? `"${value}"` : value}`;
    })
    .join('\n');
  
  return `---\n${frontmatter}\n---\n\n${content}`;
}

// Simple markdown parser (basic implementation)
function parseMarkdown(markdown) {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
  
  // Inline code
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>');
  
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/gim, '<img src="$2" alt="$1">');
  
  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
  
  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // Wrap consecutive list items
  html = html.replace(/(<li>.*<\/li>\n?)+/gim, '<ul>$&</ul>');
  
  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (!para.trim() || para.startsWith('<')) return para;
    return `<p>${para}</p>`;
  }).join('\n');
  
  return html;
}

// Load config
async function loadConfig() {
  const result = await window.electronAPI.getConfig();
  if (result.success) {
    config = result.config || {};
    document.getElementById('config-repo').value = config.repo || '';
    document.getElementById('config-token').value = config.token || '';
    document.getElementById('config-branch').value = config.branch || 'main';
  }
}

// Save config
async function saveConfig() {
  config = {
    repo: document.getElementById('config-repo').value,
    token: document.getElementById('config-token').value,
    branch: document.getElementById('config-branch').value || 'main'
  };
  await window.electronAPI.saveConfig(config);
  document.getElementById('settings-modal').classList.remove('active');
}

// Load posts
async function loadPosts() {
  const result = await window.electronAPI.getPosts();
  if (result.success) {
    renderPostsList(result.posts);
  }
}

// Render posts list
function renderPostsList(posts) {
  const list = document.getElementById('posts-list');
  
  if (posts.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-text">No posts found</div>
        <div class="empty-state-hint">Click "New Post" to create one</div>
      </div>
    `;
    return;
  }
  
  list.innerHTML = posts.map(post => {
    const date = extractDate(post.content);
    return `
      <div class="post-item" data-filename="${post.filename}">
        <div class="post-filename">${post.filename}</div>
        <div class="post-date">${date || 'No date'}</div>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  list.querySelectorAll('.post-item').forEach(item => {
    item.addEventListener('click', () => {
      const filename = item.dataset.filename;
      loadPost(filename, posts.find(p => p.filename === filename));
    });
  });
}

// Extract date from frontmatter
function extractDate(content) {
  try {
    const { data } = parseFrontmatter(content);
    return data.date || null;
  } catch {
    return null;
  }
}

// Extract title from frontmatter
function extractTitle(content) {
  try {
    const { data } = parseFrontmatter(content);
    return data.title || 'Untitled';
  } catch {
    return 'Untitled';
  }
}

// Load post
async function loadPost(filename, postData) {
  if (!postData) {
    const result = await window.electronAPI.getPosts();
    if (result.success) {
      postData = result.posts.find(p => p.filename === filename);
    }
  }
  
  if (!postData) return;
  
  currentPost = filename;
  currentContent = postData.content;
  isDirty = false;
  
  // Update active post in list
  document.querySelectorAll('.post-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.filename === filename) {
      item.classList.add('active');
    }
  });
  
  renderEditor();
}

// Render editor
function renderEditor() {
  const container = document.getElementById('editor-container');
  
  container.innerHTML = `
    <div class="editor-tabs">
      <button class="tab active" data-tab="edit">Edit</button>
      <button class="tab" data-tab="preview">Preview</button>
    </div>
    <div class="editor-content">
      <div class="editor-pane" id="edit-pane">
        <div class="pane-header">Markdown</div>
        <textarea id="editor-textarea" spellcheck="false">${escapeHtml(currentContent)}</textarea>
      </div>
      <div class="editor-pane" id="preview-pane" style="display: none;">
        <div class="pane-header">Preview</div>
        <div class="preview">
          <div class="preview-content" id="preview-content"></div>
        </div>
      </div>
    </div>
  `;
  
  // Setup editor
  const textarea = document.getElementById('editor-textarea');
  textarea.addEventListener('input', (e) => {
    currentContent = e.target.value;
    isDirty = true;
    updateStatus();
    updatePreview();
    updateCharCount();
  });
  
  // Setup tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      if (tabName === 'edit') {
        document.getElementById('edit-pane').style.display = 'flex';
        document.getElementById('preview-pane').style.display = 'none';
      } else {
        document.getElementById('edit-pane').style.display = 'none';
        document.getElementById('preview-pane').style.display = 'flex';
        updatePreview();
      }
    });
  });
  
  updatePreview();
  updateCharCount();
  updateStatus();
}

// Update preview
function updatePreview() {
  try {
    const { content } = parseFrontmatter(currentContent);
    const html = parseMarkdown(content);
    document.getElementById('preview-content').innerHTML = html;
  } catch (error) {
    document.getElementById('preview-content').innerHTML = '<p style="color: #ff0000;">Error parsing markdown</p>';
  }
}

// Update character count
function updateCharCount() {
  const count = currentContent.length;
  document.getElementById('char-count').textContent = `${count} characters`;
}

// Update status
function updateStatus() {
  const indicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  
  if (isDirty) {
    indicator.classList.remove('saved');
    indicator.classList.add('unsaved');
    statusText.textContent = 'Unsaved changes';
  } else {
    indicator.classList.remove('unsaved');
    indicator.classList.add('saved');
    statusText.textContent = 'Saved';
  }
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Create new post
function showNewPostModal() {
  const modal = document.getElementById('new-post-modal');
  const titleInput = document.getElementById('new-post-title');
  modal.classList.add('active');
  titleInput.value = '';
  titleInput.focus();
  
  // Handle Enter key
  titleInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      createNewPostFromModal();
    } else if (e.key === 'Escape') {
      modal.classList.remove('active');
    }
  };
}

function createNewPostFromModal() {
  const titleInput = document.getElementById('new-post-title');
  const title = titleInput.value.trim();
  
  if (!title) {
    alert('Please enter a post title');
    return;
  }
  
  document.getElementById('new-post-modal').classList.remove('active');
  
  const date = new Date().toISOString().split('T')[0];
  const slug = title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = `${date}-${slug}.md`;
  
  const template = `---
title: ${title}
date: ${date}
tags: []
---

Write your post content here...

`;
  
  currentPost = filename;
  currentContent = template;
  isDirty = true;
  
  // Render editor first
  renderEditor();
  
  // Save immediately (async)
  setTimeout(async () => {
    await savePost();
    await loadPosts();
  }, 100);
}

// Save post
async function savePost() {
  if (!currentPost) return;
  
  const result = await window.electronAPI.savePost({
    filename: currentPost,
    content: currentContent
  });
  
  if (result.success) {
    isDirty = false;
    updateStatus();
    loadPosts();
  } else {
    alert('Error saving post: ' + result.error);
  }
}

// Upload post
async function uploadPost() {
  if (!currentPost) {
    alert('No post selected');
    return;
  }
  
  if (!config.repo || !config.token) {
    document.getElementById('settings-modal').classList.add('active');
    alert('Please configure GitHub repository and token in settings');
    return;
  }
  
  // Save locally first
  await savePost();
  
  // Show uploading status
  const uploadBtn = document.getElementById('upload-btn');
  const originalText = uploadBtn.textContent;
  uploadBtn.textContent = 'Uploading...';
  uploadBtn.disabled = true;
  
  try {
    const result = await window.electronAPI.uploadPost({
      filename: currentPost,
      token: config.token,
      repo: config.repo,
      branch: config.branch,
      useGit: true
    });
    
    if (result.success) {
      // Generate index locally (workflow will regenerate it on deploy)
      await window.electronAPI.generateIndex();
      
      // Check if git push was used (workflow auto-triggers) or API (we trigger manually)
      const message = 'Post uploaded successfully! Deployment workflow is starting...';
      alert(message);
      isDirty = false;
      updateStatus();
    } else {
      alert('Error uploading post: ' + result.error);
    }
  } finally {
    uploadBtn.textContent = originalText;
    uploadBtn.disabled = false;
  }
}

// Auto-save
setInterval(() => {
  if (isDirty && currentPost) {
    savePost();
  }
}, 30000); // Auto-save every 30 seconds

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    savePost();
  }
});

// Event listeners
document.getElementById('new-post-btn').addEventListener('click', showNewPostModal);
document.getElementById('new-post-create').addEventListener('click', createNewPostFromModal);
document.getElementById('new-post-cancel').addEventListener('click', () => {
  document.getElementById('new-post-modal').classList.remove('active');
});
document.getElementById('upload-btn').addEventListener('click', uploadPost);
document.getElementById('settings-btn').addEventListener('click', () => {
  document.getElementById('settings-modal').classList.add('active');
});
document.getElementById('settings-cancel').addEventListener('click', () => {
  document.getElementById('settings-modal').classList.remove('active');
});
document.getElementById('settings-save').addEventListener('click', saveConfig);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  loadConfig().then(() => {
    loadPosts();
  });
}
