import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MarkdownComponent } from 'ngx-markdown';

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  topics: string[];
  readme?: string;
}

interface Project {
  name: string;
  description?: string;
  url?: string;
  year?: string;
  tech?: string[];
  repo?: string;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MarkdownComponent],
  template: `
    <div class="project-detail-container">
      <a routerLink="/projects" class="back-link">
        <span class="back-arrow">←</span>
        <span>Back to Projects</span>
      </a>
      
      <div *ngIf="loading" class="loading">
        <div class="loading-text">Loading project...</div>
      </div>
      
      <div *ngIf="!loading && !repoData" class="error">
        <p>Project not found or repository is private.</p>
      </div>
      
      <article *ngIf="!loading && repoData" class="project-content">
        <header class="project-header">
          <h1 class="project-title">
            <a [href]="repoData.html_url" target="_blank" rel="noopener noreferrer">
              {{ repoData.name }}
              <span class="external-link">↗</span>
            </a>
          </h1>
          <div class="project-meta-bar">
            <a [href]="repoData.html_url" target="_blank" rel="noopener noreferrer" class="repo-link">
              {{ repoData.full_name }}
            </a>
            <div class="stats">
              <span class="stat">
                <span class="stat-value">{{ repoData.stargazers_count }}</span>
                <span class="stat-label">Stars</span>
              </span>
              <span class="stat">
                <span class="stat-value">{{ repoData.forks_count }}</span>
                <span class="stat-label">Forks</span>
              </span>
              <span class="stat" *ngIf="repoData.language">
                <span class="stat-value">{{ repoData.language }}</span>
                <span class="stat-label">Language</span>
              </span>
            </div>
          </div>
        </header>
        
        <div class="project-description" *ngIf="repoData.description">
          <p>{{ repoData.description }}</p>
        </div>
        
        <div class="project-links" *ngIf="repoData.homepage">
          <a [href]="repoData.homepage" target="_blank" rel="noopener noreferrer" class="homepage-link">
            Visit Website ↗
          </a>
        </div>
        
        <div class="project-topics" *ngIf="repoData.topics && repoData.topics.length > 0">
          <span *ngFor="let topic of repoData.topics" class="topic-tag">{{ topic }}</span>
        </div>
        
        <div class="readme-section" *ngIf="readmeContent">
          <h2 class="readme-title">README</h2>
          <div class="readme-content">
            <markdown [data]="readmeContent"></markdown>
          </div>
        </div>
      </article>
    </div>
  `,
  styles: [`
    .project-detail-container {
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
    
    .project-content {
      color: var(--color-text);
    }
    
    .project-header {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--color-border);
    }
    
    .project-title {
      font-size: var(--font-size-2xl);
      font-weight: 600;
      line-height: var(--line-height-tight);
      letter-spacing: -0.03em;
      margin: 0 0 1.5rem 0;
      color: var(--color-text);
    }
    
    .project-title a {
      color: var(--color-text);
      transition: opacity var(--transition-base);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .project-title a:hover {
      opacity: 0.7;
    }
    
    .external-link {
      font-size: 0.875em;
      opacity: 0.6;
    }
    
    .project-meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }
    
    .repo-link {
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: color var(--transition-base);
      cursor: pointer;
    }
    
    .repo-link:hover {
      color: var(--color-text);
    }
    
    .stats {
      display: flex;
      gap: 2rem;
      align-items: center;
    }
    
    .stat {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }
    
    .stat-value {
      font-size: var(--font-size-base);
      color: var(--color-text);
      font-weight: 600;
    }
    
    .stat-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .project-description {
      margin-bottom: 2rem;
    }
    
    .project-description p {
      font-size: var(--font-size-lg);
      line-height: var(--line-height-relaxed);
      color: var(--color-text-secondary);
      margin: 0;
    }
    
    .project-links {
      margin-bottom: 2rem;
    }
    
    .homepage-link {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      border: 1px solid var(--color-border);
      color: var(--color-text);
      text-decoration: none;
      font-size: var(--font-size-sm);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
      transition: all var(--transition-base);
      cursor: pointer;
    }
    
    .homepage-link:hover {
      border-color: var(--color-text);
      background: rgba(255, 255, 255, 0.05);
    }
    
    .project-topics {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 3rem;
    }
    
    .topic-tag {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: transparent;
      color: var(--color-text-muted);
      border: 1px solid var(--color-border);
      border-radius: 2px;
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
    }
    
    .readme-section {
      margin-top: 3rem;
      padding-top: 3rem;
      border-top: 1px solid var(--color-border);
    }
    
    .readme-title {
      font-size: var(--font-size-xl);
      font-weight: 600;
      line-height: var(--line-height-tight);
      letter-spacing: -0.02em;
      margin: 0 0 2rem 0;
      color: var(--color-text);
    }
    
    .readme-content {
      color: var(--color-text);
      line-height: var(--line-height-relaxed);
    }
    
    .readme-content ::ng-deep h1 {
      font-size: var(--font-size-2xl);
      font-weight: 600;
      line-height: var(--line-height-tight);
      letter-spacing: -0.02em;
      margin: 0 0 1.5rem 0;
      color: var(--color-text);
    }
    
    .readme-content ::ng-deep h2 {
      font-size: var(--font-size-xl);
      font-weight: 600;
      line-height: var(--line-height-tight);
      letter-spacing: -0.01em;
      margin: 3rem 0 1rem 0;
      color: var(--color-text);
    }
    
    .readme-content ::ng-deep h3 {
      font-size: var(--font-size-lg);
      font-weight: 600;
      line-height: var(--line-height-tight);
      margin: 2rem 0 0.75rem 0;
      color: var(--color-text);
    }
    
    .readme-content ::ng-deep p {
      line-height: var(--line-height-relaxed);
      color: var(--color-text);
      margin: 0 0 1.5rem 0;
    }
    
    .readme-content ::ng-deep code {
      background: rgba(255, 255, 255, 0.05);
      padding: 0.15rem 0.4rem;
      border: 1px solid var(--color-border);
      border-radius: 3px;
      font-size: 0.9em;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      color: var(--color-text);
    }
    
    .readme-content ::ng-deep pre {
      background: rgba(255, 255, 255, 0.03);
      padding: 1.5rem;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      overflow-x: auto;
      margin: 2rem 0;
      line-height: var(--line-height-relaxed);
    }
    
    .readme-content ::ng-deep pre code {
      background: transparent;
      padding: 0;
      border: none;
      font-size: 0.875em;
    }
    
    .readme-content ::ng-deep a {
      color: var(--color-text);
      text-decoration: underline;
      text-decoration-thickness: 1px;
      text-underline-offset: 2px;
      transition: opacity var(--transition-base);
      cursor: pointer;
    }
    
    .readme-content ::ng-deep a:hover {
      opacity: 0.7;
    }
    
    @media (max-width: 768px) {
      .project-title {
        font-size: var(--font-size-xl);
      }
      
      .project-meta-bar {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .stats {
        gap: 1.5rem;
      }
      
      .back-link {
        margin-bottom: 2rem;
      }
    }
  `]
})
export class ProjectDetailComponent implements OnInit {
  repoData: GitHubRepo | null = null;
  readmeContent: string | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const repoPath = params['repo'];
      this.loadProject(repoPath);
    });
  }

  loadProject(repoPath: string) {
    this.loading = true;
    const [owner, repo] = repoPath.split('/');
    
    if (!owner || !repo) {
      this.loading = false;
      return;
    }

    // Load repository data from GitHub API
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    
    this.http.get<GitHubRepo>(apiUrl).subscribe({
      next: (data) => {
        this.repoData = data;
        this.loadReadme(owner, repo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading repository:', error);
        this.repoData = null;
        this.loading = false;
      }
    });
  }

  loadReadme(owner: string, repo: string) {
    // Try to load README.md
    const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
    
    this.http.get<any>(readmeUrl).subscribe({
      next: (data) => {
        if (data.content) {
          // Decode base64 content
          const content = atob(data.content);
          // Remove frontmatter if present
          const frontmatterRegex = /^---\s*\n[\s\S]*?\n---\s*\n/;
          this.readmeContent = content.replace(frontmatterRegex, '').trim();
        }
      },
      error: (error) => {
        // README not found or error - that's okay
        console.warn('README not found:', error);
      }
    });
  }
}
