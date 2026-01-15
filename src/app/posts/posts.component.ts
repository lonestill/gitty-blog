import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Post {
  path: string;
  title: string;
  date?: string;
  author?: string;
  tags?: string[];
  category?: string;
  excerpt?: string;
}

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="posts-wrapper">
      <aside class="tags-sidebar" *ngIf="!loading && allTags.length > 0">
        <div class="sidebar-content">
          <div class="sidebar-header">
            <span class="sidebar-title">Tags</span>
            <button 
              *ngIf="selectedTags.length > 0" 
              (click)="clearFilters()" 
              class="clear-btn"
              title="Clear filters">
              ×
            </button>
          </div>
          <div class="tags-list">
            <button
              *ngFor="let tag of allTags"
              (click)="toggleTag(tag)"
              [class.active]="isTagSelected(tag)"
              class="sidebar-tag">
              {{ tag }}
            </button>
          </div>
        </div>
      </aside>
      
      <div class="posts-container">
        <h1 class="page-title">All Posts</h1>
        
        <div class="active-filters-bar" *ngIf="selectedTags.length > 0">
          <span class="active-label">Filtered:</span>
          <span *ngFor="let tag of selectedTags" class="active-tag">
            {{ tag }}
            <button (click)="toggleTag(tag)" class="remove-tag" title="Remove filter">×</button>
          </span>
        </div>
        
        <div *ngIf="loading" class="loading">
          <div class="loading-text">Loading posts...</div>
        </div>
        <div *ngIf="!loading && filteredPosts.length === 0 && selectedTags.length === 0" class="empty">
          <p>No posts found.</p>
        </div>
        <div *ngIf="!loading && filteredPosts.length === 0 && selectedTags.length > 0" class="empty">
          <p>No posts found with selected tags.</p>
          <button (click)="clearFilters()" class="clear-filters-btn">Clear filters</button>
        </div>
        <div class="posts-list" *ngIf="!loading && filteredPosts.length > 0">
          <article *ngFor="let post of filteredPosts; trackBy: trackByPath" class="post-card">
            <div class="post-header">
              <h2 class="post-title">
                <a [routerLink]="['/post', post.path]">{{ post.title }}</a>
              </h2>
              <div class="post-meta" *ngIf="post.date || post.author">
                <time *ngIf="post.date" [attr.datetime]="post.date">{{ post.date | date:'MMM d, y' }}</time>
                <span *ngIf="post.author" class="author">{{ post.author }}</span>
              </div>
            </div>
            <p class="post-excerpt" *ngIf="post.excerpt">{{ post.excerpt }}</p>
            <div class="post-footer">
              <div class="post-tags" *ngIf="post.tags && post.tags.length > 0">
                <button
                  *ngFor="let tag of post.tags"
                  (click)="selectTag(tag)"
                  class="tag">
                  {{ tag }}
                </button>
              </div>
              <a [routerLink]="['/post', post.path]" class="read-more">Read →</a>
            </div>
          </article>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .posts-wrapper {
      display: flex;
      gap: 4rem;
      align-items: flex-start;
      width: 100%;
    }
    
    .tags-sidebar {
      position: sticky;
      top: 7rem;
      flex-shrink: 0;
      width: 180px;
      max-height: calc(100vh - 9rem);
      display: flex;
      flex-direction: column;
    }
    
    .sidebar-content {
      border-left: 1px solid var(--color-border);
      padding-left: 1.5rem;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    
    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-shrink: 0;
    }
    
    .sidebar-title {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 500;
    }
    
    .clear-btn {
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      font-size: 1.25rem;
      line-height: 1;
      padding: 0;
      width: 1.25rem;
      height: 1.25rem;
      cursor: pointer;
      transition: color var(--transition-base);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .clear-btn:hover {
      color: var(--color-text);
    }
    
    .tags-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      overflow-y: auto;
      overflow-x: hidden;
      flex: 1;
      padding-right: 0.5rem;
    }
    
    .tags-list::-webkit-scrollbar {
      width: 4px;
    }
    
    .tags-list::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .tags-list::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: 2px;
    }
    
    .tags-list::-webkit-scrollbar-thumb:hover {
      background: var(--color-text-muted);
    }
    
    .sidebar-tag {
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      padding: 0.25rem 0;
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 400;
      text-align: left;
      transition: color var(--transition-base);
      cursor: pointer;
      font-family: inherit;
    }
    
    .sidebar-tag:hover {
      color: var(--color-text-secondary);
    }
    
    .sidebar-tag.active {
      color: var(--color-text);
      font-weight: 500;
    }
    
    .posts-container {
      flex: 1;
      min-width: 0;
    }
    
    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: 600;
      line-height: var(--line-height-tight);
      letter-spacing: -0.03em;
      margin: 0 0 3rem 0;
      color: var(--color-text);
    }
    
    .active-filters-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--color-border);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .active-label {
      font-weight: 500;
    }
    
    .active-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.5rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--color-border);
      border-radius: 2px;
      color: var(--color-text);
      font-weight: 500;
    }
    
    .remove-tag {
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      font-size: 1rem;
      line-height: 1;
      padding: 0;
      width: 1rem;
      height: 1rem;
      cursor: pointer;
      transition: color var(--transition-base);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .remove-tag:hover {
      color: var(--color-text);
    }
    
    .clear-filters-btn {
      margin-top: 1rem;
      background: transparent;
      border: 1px solid var(--color-border);
      color: var(--color-text);
      padding: 0.5rem 1.5rem;
      font-size: var(--font-size-sm);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-base);
      font-family: inherit;
    }
    
    .clear-filters-btn:hover {
      border-color: var(--color-text);
      background: rgba(255, 255, 255, 0.05);
    }
    
    .posts-list {
      display: flex;
      flex-direction: column;
      gap: 3rem;
    }
    
    .post-card {
      padding-bottom: 3rem;
      border-bottom: 1px solid var(--color-border);
      transition: opacity var(--transition-base);
    }
    
    .post-card:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .post-card:hover {
      opacity: 0.8;
    }
    
    .post-header {
      margin-bottom: 1rem;
    }
    
    .post-title {
      margin: 0 0 0.75rem 0;
      font-size: var(--font-size-xl);
      font-weight: 600;
      line-height: var(--line-height-tight);
      letter-spacing: -0.02em;
    }
    
    .post-title a {
      color: var(--color-text);
      transition: opacity var(--transition-base);
      cursor: pointer;
    }
    
    .post-title a:hover {
      opacity: 0.7;
    }
    
    .post-meta {
      display: flex;
      gap: 1rem;
      align-items: center;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
    }
    
    .post-meta time {
      display: block;
    }
    
    .post-meta .author {
      display: block;
    }
    
    .post-excerpt {
      color: var(--color-text-secondary);
      line-height: var(--line-height-relaxed);
      margin: 0 0 1.5rem 0;
      font-size: var(--font-size-base);
    }
    
    .post-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    
    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .tag {
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
      transition: all var(--transition-base);
      cursor: pointer;
      font-family: inherit;
      border: none;
      padding: 0;
      margin: 0;
    }
    
    .tag:hover {
      color: var(--color-text);
      opacity: 0.7;
    }
    
    .read-more {
      font-size: var(--font-size-sm);
      color: var(--color-text);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: opacity var(--transition-base);
      white-space: nowrap;
      cursor: pointer;
    }
    
    .read-more:hover {
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
    
    @media (max-width: 1024px) {
      .tags-sidebar {
        display: none;
      }
      
      .posts-wrapper {
        gap: 0;
      }
    }
    
    @media (max-width: 768px) {
      .page-title {
        font-size: var(--font-size-xl);
        margin-bottom: 2rem;
      }
      
      .posts-list {
        gap: 2.5rem;
      }
      
      .post-card {
        padding-bottom: 2.5rem;
      }
      
      .post-title {
        font-size: var(--font-size-lg);
      }
      
      .post-footer {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class PostsComponent implements OnInit {
  posts: Post[] = [];
  filteredPosts: Post[] = [];
  allTags: string[] = [];
  selectedTags: string[] = [];
  loading = true;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Check for tag query parameter
    this.route.queryParams.subscribe(params => {
      const tagParam = params['tag'];
      if (tagParam && typeof tagParam === 'string') {
        this.selectedTags = [tagParam];
      }
    });

    this.http.get<Post[]>('assets/posts.json').subscribe({
      next: (data) => {
        this.posts = data;
        this.extractAllTags();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.loading = false;
      }
    });
  }

  extractAllTags() {
    const tagsSet = new Set<string>();
    this.posts.forEach(post => {
      if (post.tags && post.tags.length > 0) {
        post.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    this.allTags = Array.from(tagsSet).sort();
  }

  toggleTag(tag: string) {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
    this.applyFilters();
  }

  selectTag(tag: string) {
    if (!this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
      this.applyFilters();
    }
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  applyFilters() {
    if (this.selectedTags.length === 0) {
      this.filteredPosts = this.posts;
      // Clear query params if no filters
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
      return;
    }

    this.filteredPosts = this.posts.filter(post => {
      if (!post.tags || post.tags.length === 0) {
        return false;
      }
      // Post must have at least one of the selected tags
      return this.selectedTags.some(selectedTag => 
        post.tags!.includes(selectedTag)
      );
    });

    // Update URL with selected tags
    if (this.selectedTags.length === 1) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tag: this.selectedTags[0] },
        replaceUrl: true
      });
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }
  }

  clearFilters() {
    this.selectedTags = [];
    this.applyFilters();
  }

  trackByPath(index: number, post: Post): string {
    return post.path;
  }
}
