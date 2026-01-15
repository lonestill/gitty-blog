import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Project {
  name: string;
  description?: string;
  url?: string;
  year?: string;
  tech?: string[];
  repo?: string; // GitHub repo in format owner/repo
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="projects-container">
      <h1 class="page-title">Projects</h1>
      
      <div *ngIf="loading" class="loading">
        <div class="loading-text">Loading projects...</div>
      </div>
      <div *ngIf="!loading && projects.length === 0" class="empty">
        <p>No projects found.</p>
      </div>
      <div class="projects-list" *ngIf="!loading && projects.length > 0">
        <article *ngFor="let project of projects; trackBy: trackByName" class="project-card">
          <div class="project-header">
            <h2 class="project-title">
              <a *ngIf="project.repo" [routerLink]="['/project', project.repo]">{{ project.name }}</a>
              <span *ngIf="!project.repo">{{ project.name }}</span>
            </h2>
            <div class="project-meta" *ngIf="project.year">
              <span class="project-year">{{ project.year }}</span>
            </div>
          </div>
          <p class="project-description" *ngIf="project.description">{{ project.description }}</p>
          <div class="project-footer">
            <div class="project-tech" *ngIf="project.tech && project.tech.length > 0">
              <span *ngFor="let tech of project.tech" class="tech-tag">{{ tech }}</span>
            </div>
            <a *ngIf="project.repo" [routerLink]="['/project', project.repo]" class="view-project">View →</a>
            <a *ngIf="project.url && !project.repo" [href]="project.url" target="_blank" rel="noopener noreferrer" class="view-project">
              Visit ↗
            </a>
          </div>
        </article>
      </div>
    </div>
  `,
  styles: [`
    .projects-container {
      width: 100%;
    }
    
    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: 600;
      line-height: var(--line-height-tight);
      letter-spacing: -0.03em;
      margin: 0 0 3rem 0;
      color: var(--color-text);
    }
    
    .projects-list {
      display: flex;
      flex-direction: column;
      gap: 3rem;
    }
    
    .project-card {
      padding-bottom: 3rem;
      border-bottom: 1px solid var(--color-border);
      transition: opacity var(--transition-base);
    }
    
    .project-card:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .project-card:hover {
      opacity: 0.8;
    }
    
    .project-header {
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
    }
    
    .project-title {
      margin: 0;
      font-size: var(--font-size-xl);
      font-weight: 600;
      line-height: var(--line-height-tight);
      letter-spacing: -0.02em;
    }
    
    .project-title a {
      color: var(--color-text);
      transition: opacity var(--transition-base);
      cursor: pointer;
    }
    
    .project-title a:hover {
      opacity: 0.7;
    }
    
    .project-title span {
      color: var(--color-text);
    }
    
    .project-meta {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
      flex-shrink: 0;
    }
    
    .project-description {
      color: var(--color-text-secondary);
      line-height: var(--line-height-relaxed);
      margin: 0 0 1.5rem 0;
      font-size: var(--font-size-base);
    }
    
    .project-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    
    .project-tech {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .tech-tag {
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
    
    .view-project {
      font-size: var(--font-size-sm);
      color: var(--color-text);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: opacity var(--transition-base);
      white-space: nowrap;
      cursor: pointer;
    }
    
    .view-project:hover {
      opacity: 0.6;
    }
    
    .loading, .empty {
      text-align: center;
      padding: var(--spacing-xl) 0;
    }
    
    .loading-text {
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    .empty p {
      color: var(--color-text-muted);
      font-size: var(--font-size-base);
    }
    
    @media (max-width: 768px) {
      .page-title {
        font-size: var(--font-size-xl);
        margin-bottom: 2rem;
      }
      
      .projects-list {
        gap: 2.5rem;
      }
      
      .project-card {
        padding-bottom: 2.5rem;
      }
      
      .project-title {
        font-size: var(--font-size-lg);
      }
      
      .project-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      
      .project-footer {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  loading = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<Project[]>('assets/projects.json').subscribe({
      next: (data) => {
        this.projects = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.loading = false;
      }
    });
  }

  trackByName(index: number, project: Project): string {
    return project.name;
  }
}
