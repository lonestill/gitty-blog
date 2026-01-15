const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

/**
 * Recursively find all .md files in a directory
 * @param {string} dir - Directory to search
 * @param {string[]} fileList - Accumulator for file paths
 * @returns {string[]} Array of file paths
 */
function findMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Extract frontmatter and content summary from markdown file
 * @param {string} filePath - Path to markdown file
 * @param {string} contentRoot - Root content directory
 * @returns {Object} Post summary object
 */
function processMarkdownFile(filePath, contentRoot) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);
    
    // Get relative path from content root
    const relativePath = path.relative(contentRoot, filePath);
    const relativePathNormalized = relativePath.replace(/\\/g, '/'); // Normalize for cross-platform
    
    // Extract first paragraph or first 200 characters as excerpt
    const excerpt = content
      .split('\n\n')
      .find(para => para.trim().length > 0) || content.substring(0, 200);
    
    // Build post summary
    const postSummary = {
      path: relativePathNormalized,
      title: frontmatter.title || path.basename(filePath, '.md'),
      date: frontmatter.date || null,
      author: frontmatter.author || null,
      tags: frontmatter.tags || [],
      category: frontmatter.category || null,
      excerpt: excerpt.trim().substring(0, 200),
      ...frontmatter // Include all other frontmatter fields
    };
    
    return postSummary;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Main function to generate posts index
 */
function generateIndex() {
  const contentRoot = path.join(__dirname, '..', 'content');
  const outputPath = path.join(__dirname, '..', 'src', 'assets', 'posts.json');
  
  // Check if content directory exists
  if (!fs.existsSync(contentRoot)) {
    console.warn(`Content directory not found: ${contentRoot}`);
    console.log('Creating empty posts.json...');
    
    // Ensure assets directory exists
    const assetsDir = path.dirname(outputPath);
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Write empty array
    fs.writeFileSync(outputPath, JSON.stringify([], null, 2));
    console.log(`Created empty posts.json at ${outputPath}`);
    return;
  }
  
  // Find all markdown files
  console.log(`Scanning for markdown files in: ${contentRoot}`);
  const markdownFiles = findMarkdownFiles(contentRoot);
  console.log(`Found ${markdownFiles.length} markdown file(s)`);
  
  // Process each file
  const posts = markdownFiles
    .map(filePath => processMarkdownFile(filePath, contentRoot))
    .filter(post => post !== null) // Remove failed processing
    .sort((a, b) => {
      // Sort by date (newest first) if available, otherwise by title
      if (a.date && b.date) {
        return new Date(b.date) - new Date(a.date);
      }
      if (a.date) return -1;
      if (b.date) return 1;
      return a.title.localeCompare(b.title);
    });
  
  // Ensure assets directory exists
  const assetsDir = path.dirname(outputPath);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  // Write posts.json
  fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2), 'utf-8');
  console.log(`✓ Generated posts.json with ${posts.length} post(s) at ${outputPath}`);
  
  // Copy markdown files to assets/content for deployment
  const assetsContentDir = path.join(__dirname, '..', 'src', 'assets', 'content');
  if (!fs.existsSync(assetsContentDir)) {
    fs.mkdirSync(assetsContentDir, { recursive: true });
  }
  
  console.log(`Copying markdown files to assets/content...`);
  markdownFiles.forEach(filePath => {
    const relativePath = path.relative(contentRoot, filePath);
    const targetPath = path.join(assetsContentDir, relativePath);
    const targetDir = path.dirname(targetPath);
    
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy file
    fs.copyFileSync(filePath, targetPath);
  });
  console.log(`✓ Copied ${markdownFiles.length} markdown file(s) to assets/content`);
}

// Run if called directly
if (require.main === module) {
  generateIndex();
}

module.exports = { generateIndex };
