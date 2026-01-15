#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { uploadFile } = require('./upload.js');
const { generateIndex } = require('../scripts/generate-index.js');

/**
 * CLI tool to create a new blog post
 * 
 * Usage: npm run new-post [title]
 *        node cli/new-post.js [title]
 * 
 * Options:
 *   --editor <editor>    Editor to open (default: code, vim, nano, or $EDITOR)
 *   --no-upload          Don't upload to GitHub after creation
 *   --no-open            Don't open editor
 */

const CONTENT_DIR = path.join(__dirname, '..', 'content');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    title: null,
    editor: process.env.EDITOR || 'code',
    upload: true,
    openEditor: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--editor' && args[i + 1]) {
      options.editor = args[++i];
    } else if (arg === '--no-upload') {
      options.upload = false;
    } else if (arg === '--no-open') {
      options.openEditor = false;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith('--') && !options.title) {
      options.title = arg;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Usage: npm run new-post [title] [options]
       node cli/new-post.js [title] [options]

Create a new blog post with frontmatter template.

Arguments:
  title                   Post title (will be prompted if not provided)

Options:
  --editor <editor>      Editor to open (default: code, vim, nano, or $EDITOR)
  --no-upload            Don't upload to GitHub after creation
  --no-open              Don't open editor automatically
  --help, -h             Show this help message

Environment Variables:
  EDITOR                  Default editor to use
  GITHUB_TOKEN            GitHub personal access token (for upload)
  GITHUB_REPOSITORY       GitHub repository in format owner/repo (for upload)

Examples:
  npm run new-post "My New Post"
  npm run new-post "My Post" --editor vim
  npm run new-post --no-upload
`);
}

// Generate slug from title
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate filename from title
function generateFilename(title) {
  const slug = slugify(title);
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${date}-${slug}.md`;
}

// Create post template
function createPostTemplate(title) {
  const date = new Date().toISOString().split('T')[0];
  
  return `---
title: ${title}
date: ${date}
tags: []
---

Write your post content here...

`;
}

// Prompt for title if not provided
function promptTitle() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter post title: ', (title) => {
      rl.close();
      resolve(title.trim());
    });
  });
}

// Open file in editor
function openInEditor(filePath, editor) {
  try {
    if (editor === 'code') {
      // VS Code
      execSync(`code "${filePath}"`, { stdio: 'inherit' });
    } else if (editor === 'vim' || editor === 'vi') {
      execSync(`vim "${filePath}"`, { stdio: 'inherit' });
    } else if (editor === 'nano') {
      execSync(`nano "${filePath}"`, { stdio: 'inherit' });
    } else {
      // Generic editor
      execSync(`${editor} "${filePath}"`, { stdio: 'inherit' });
    }
  } catch (error) {
    console.warn(`Warning: Could not open editor "${editor}". File created at: ${filePath}`);
    console.warn(`You can edit it manually and then run: npm run upload ${path.basename(filePath)}`);
  }
}

// Main function
async function createNewPost() {
  const options = parseArgs();
  
  // Get title
  let title = options.title;
  if (!title) {
    title = await promptTitle();
    if (!title) {
      console.error('Error: Title is required');
      process.exit(1);
    }
  }

  // Ensure content directory exists
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  // Generate filename
  const filename = generateFilename(title);
  const filePath = path.join(CONTENT_DIR, filename);

  // Check if file already exists
  if (fs.existsSync(filePath)) {
    console.error(`Error: Post already exists: ${filename}`);
    console.log(`File: ${filePath}`);
    process.exit(1);
  }

  // Create post template
  const template = createPostTemplate(title);
  fs.writeFileSync(filePath, template, 'utf-8');
  console.log(`✓ Created new post: ${filename}`);
  console.log(`  Path: ${filePath}`);

  // Open in editor
  if (options.openEditor) {
    console.log(`\nOpening in editor: ${options.editor}...`);
    openInEditor(filePath, options.editor);
  }

  // Wait a bit for user to edit (if editor was opened)
  if (options.openEditor && options.upload) {
    console.log('\n⏳ Waiting for you to finish editing...');
    console.log('Press Enter when done to upload to GitHub (or Ctrl+C to cancel)');
    
    await new Promise((resolve) => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
  }

  // Upload to GitHub
  if (options.upload) {
    console.log('\n📤 Uploading to GitHub...');
    try {
      await uploadFile({
        filePath: filePath,
        repo: process.env.GITHUB_REPOSITORY || null,
        token: process.env.GITHUB_TOKEN || null,
        branch: 'main',
        message: null
      });
      
      console.log('\n🔄 Regenerating index...');
      generateIndex();
      
      console.log('\n✅ Post created and uploaded successfully!');
    } catch (error) {
      console.error('\n❌ Error uploading:', error.message);
      console.log(`\nYou can upload manually later with:`);
      console.log(`  npm run upload ${filename}`);
      process.exit(1);
    }
  } else {
    console.log('\n📝 Post created locally.');
    console.log(`\nTo upload later, run:`);
    console.log(`  npm run upload ${filename}`);
  }
}

// Run if called directly
if (require.main === module) {
  createNewPost().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { createNewPost };
