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
      <a routerLink="/posts" class="back-link">← Back to Posts</a>
      <div *ngIf="loading" class="loading">Loading post...</div>
      <div *ngIf="!loading && !content" class="error">
        Post not found.
      </div>
      <article *ngIf="!loading && content" class="post-content">
        <markdown [data]="content"></markdown>
      </article>
    </div>
  `,
  styles: [`
    .post-detail-container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .back-link {
      display: inline-block;
      margin-bottom: 2rem;
      color: #0366d6;
      text-decoration: none;
      font-weight: 500;
    }
    
    .back-link:hover {
      text-decoration: underline;
    }
    
    .loading, .error {
      text-align: center;
      padding: 3rem;
      color: #586069;
    }
    
    .post-content {
      background: white;
      padding: 2rem;
      border-radius: 6px;
      border: 1px solid #e1e4e8;
    }
    
    .post-content ::ng-deep h1 {
      color: #24292e;
      margin-top: 0;
    }
    
    .post-content ::ng-deep h2 {
      color: #24292e;
      margin-top: 2rem;
    }
    
    .post-content ::ng-deep p {
      line-height: 1.6;
      color: #24292e;
    }
    
    .post-content ::ng-deep code {
      background: #f6f8fa;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-size: 0.9em;
    }
    
    .post-content ::ng-deep pre {
      background: #f6f8fa;
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
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
        // Remove frontmatter if present (ngx-markdown will handle it, but we can keep it for metadata)
        // For now, we'll keep the frontmatter and let ngx-markdown render it
        this.content = data;
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
