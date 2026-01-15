import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MarkdownComponent],
  template: `
    <div class="post-detail-container">
      <a routerLink="/" class="back-link">
        <span class="back-arrow">←</span>
        <span>Back</span>
      </a>
      <div *ngIf="loading" class="loading">
        <div class="loading-text">Loading post...</div>
      </div>
      <div *ngIf="!loading && !content" class="error">
        <p>Post not found.</p>
      </div>
      <article *ngIf="!loading && content" class="post-content">
        <markdown [data]="content"></markdown>
      </article>
    </div>
  `,
  styles: [`
    .post-detail-container {
      width: 100%;
    }
    
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 3rem;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
      transition: color var(--transition-base);
      cursor: pointer;
    }
    
    .back-link:hover {
      color: var(--color-text);
    }
    
    .back-arrow {
      font-size: 1.2em;
      line-height: 1;
    }
    
    .loading, .error {
      text-align: center;
      padding: var(--spacing-xl) 0;
    }
    
    .loading-text {
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    .error p {
      color: var(--color-text-muted);
      font-size: var(--font-size-base);
    }
    
    .post-content {
      color: var(--color-text);
      line-height: var(--line-height-relaxed);
    }
    
    .post-content ::ng-deep h1 {
      font-size: var(--font-size-2xl);
      font-weight: 600;
      line-height: var(--line-height-tight);
      letter-spacing: -0.02em;
      margin: 0 0 1.5rem 0;
      color: var(--color-text);
    }
    
    .post-content ::ng-deep h2 {
      font-size: var(--font-size-xl);
      font-weight: 600;
      line-height: var(--line-height-tight);
      letter-spacing: -0.01em;
      margin: 3rem 0 1rem 0;
      color: var(--color-text);
    }
    
    .post-content ::ng-deep h3 {
      font-size: var(--font-size-lg);
      font-weight: 600;
      line-height: var(--line-height-tight);
      margin: 2rem 0 0.75rem 0;
      color: var(--color-text);
    }
    
    .post-content ::ng-deep p {
      line-height: var(--line-height-relaxed);
      color: var(--color-text);
      margin: 0 0 1.5rem 0;
    }
    
    .post-content ::ng-deep p:last-child {
      margin-bottom: 0;
    }
    
    .post-content ::ng-deep ul,
    .post-content ::ng-deep ol {
      margin: 0 0 1.5rem 0;
      padding-left: 1.5rem;
      line-height: var(--line-height-relaxed);
    }
    
    .post-content ::ng-deep li {
      margin-bottom: 0.5rem;
      color: var(--color-text);
    }
    
    .post-content ::ng-deep blockquote {
      margin: 2rem 0;
      padding-left: 1.5rem;
      border-left: 2px solid var(--color-border);
      color: var(--color-text-secondary);
      font-style: italic;
    }
    
    .post-content ::ng-deep a {
      color: var(--color-text);
      text-decoration: underline;
      text-decoration-thickness: 1px;
      text-underline-offset: 2px;
      transition: opacity var(--transition-base);
      cursor: pointer;
    }
    
    .post-content ::ng-deep a:hover {
      opacity: 0.7;
    }
    
    .post-content ::ng-deep code {
      background: rgba(255, 255, 255, 0.05);
      padding: 0.15rem 0.4rem;
      border: 1px solid var(--color-border);
      border-radius: 3px;
      font-size: 0.9em;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      color: var(--color-text);
    }
    
    .post-content ::ng-deep pre {
      background: rgba(255, 255, 255, 0.03);
      padding: 1.5rem;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      overflow-x: auto;
      margin: 2rem 0;
      line-height: var(--line-height-relaxed);
    }
    
    .post-content ::ng-deep pre code {
      background: transparent;
      padding: 0;
      border: none;
      font-size: 0.875em;
    }
    
    .post-content ::ng-deep hr {
      border: none;
      border-top: 1px solid var(--color-border);
      margin: 3rem 0;
    }
    
    .post-content ::ng-deep img {
      max-width: 100%;
      height: auto;
      margin: 2rem 0;
      border-radius: 4px;
    }
    
    .post-content ::ng-deep table {
      width: 100%;
      border-collapse: collapse;
      margin: 2rem 0;
    }
    
    .post-content ::ng-deep th,
    .post-content ::ng-deep td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }
    
    .post-content ::ng-deep th {
      font-weight: 600;
      color: var(--color-text);
    }
    
    @media (max-width: 768px) {
      .post-content ::ng-deep h1 {
        font-size: var(--font-size-xl);
      }
      
      .post-content ::ng-deep h2 {
        font-size: var(--font-size-lg);
      }
      
      .back-link {
        margin-bottom: 2rem;
      }
    }
  `]
})
export class PostDetailComponent implements OnInit {
  content: string | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const postPath = params['path'];
      this.loadPost(postPath);
    });
  }

  loadPost(path: string) {
    this.loading = true;
    // Load markdown file from assets/content directory
    const contentPath = `assets/content/${path}`;
    
    this.http.get(contentPath, { responseType: 'text' }).subscribe({
      next: (data) => {
        // Remove frontmatter if present
        const frontmatterRegex = /^---\s*\n[\s\S]*?\n---\s*\n/;
        this.content = data.replace(frontmatterRegex, '').trim();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading post:', error);
        this.content = null;
        this.loading = false;
      }
    });
  }
}
