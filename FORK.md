# Fork This Blog

Want to create your own blog using this platform? Follow these steps to set up your own instance.

## Quick Start

### 1. Fork This Repository

Click the "Fork" button on GitHub to create your own copy of this repository.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/gitty-blog.git
cd gitty-blog
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Repository

Update `package.json` with your repository information:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/gitty-blog.git"
  }
}
```

### 5. Customize Content

1. **Update the hero section** in `src/app/home/home.component.ts`:
   - Change the title and description
   - Update the about text

2. **Add your posts** to the `content/` directory:
   ```markdown
   ---
   title: "Your Post Title"
   date: "2024-01-01"
   author: "Your Name"
   tags: ["tag1", "tag2"]
   ---
   
   # Your Post
   
   Your content here...
   ```

3. **Generate the index**:
   ```bash
   npm run generate-index
   ```

### 6. Set Up GitHub Pages

1. Go to your repository Settings → Pages
2. Under "Source", select "GitHub Actions"
3. The workflow will automatically deploy on push to `main`

### 7. Update GitHub Actions

The workflow in `.github/workflows/main.yml` should work out of the box, but verify the repository name matches yours.

## Using the CLI Tool

### Get a GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` scope
3. Save it securely

### Upload a Post

```bash
node cli/upload.js your-post.md --repo YOUR_USERNAME/gitty-blog --token YOUR_TOKEN
```

Or set environment variables:

```bash
export GITHUB_REPOSITORY="YOUR_USERNAME/gitty-blog"
export GITHUB_TOKEN="your_token_here"
node cli/upload.js your-post.md
```

## Customization

### Change Colors

Edit CSS variables in `src/styles.css`:

```css
:root {
  --color-bg: #000000;
  --color-text: #ffffff;
  /* ... */
}
```

### Modify Layout

- Header: `src/app/app.component.ts`
- Home page: `src/app/home/home.component.ts`
- Posts page: `src/app/posts/posts.component.ts`
- Post detail: `src/app/post-detail/post-detail.component.ts`

### Update Navigation

Edit the navigation links in `src/app/app.component.ts`:

```typescript
<nav>
  <a routerLink="/" routerLinkActive="active">Home</a>
  <a routerLink="/posts" routerLinkActive="active">Posts</a>
  <!-- Add more links here -->
</nav>
```

## Development

### Start Development Server

```bash
npm start
```

Visit `http://localhost:4200`

### Build for Production

```bash
npm run build
```

This will:
1. Generate `src/assets/posts.json` from markdown files
2. Copy markdown files to `src/assets/content/`
3. Build the Angular application to `dist/gitty/browser/`

## Project Structure

```
gitty/
├── content/              # Your markdown blog posts
├── scripts/              # Build-time scripts
│   └── generate-index.js # Generates posts.json
├── cli/                  # CLI tools
│   └── upload.js        # Upload posts via GitHub API
├── src/
│   ├── app/             # Angular components
│   │   ├── home/        # Home page
│   │   ├── posts/       # Posts listing with filters
│   │   └── post-detail/ # Individual post view
│   └── assets/          # Static assets
│       └── posts.json   # Generated post index
└── .github/
    └── workflows/
        └── main.yml     # GitHub Actions deployment
```

## How It Works

1. **Content Management**: Write posts in Markdown with frontmatter in the `content/` directory
2. **Index Generation**: The `generate-index.js` script reads all `.md` files, extracts frontmatter, and creates `posts.json`
3. **Build**: Angular app reads `posts.json` and markdown files from assets
4. **Deployment**: GitHub Actions builds and deploys to GitHub Pages

## Tips

- Use consistent tags across posts for better filtering
- Keep frontmatter consistent (title, date, author, tags)
- Test locally before pushing
- Use the CLI tool for quick post uploads

## Troubleshooting

### Posts not showing up

1. Run `npm run generate-index` to regenerate the index
2. Check that markdown files are in the `content/` directory
3. Verify frontmatter is correctly formatted

### Build fails

1. Check Node.js version (requires 18+)
2. Run `npm install` again
3. Check for TypeScript errors

### GitHub Pages not updating

1. Check GitHub Actions workflow status
2. Verify Pages settings are set to "GitHub Actions"
3. Check workflow file for correct paths

## License

MIT - Feel free to use this for your own blog!
