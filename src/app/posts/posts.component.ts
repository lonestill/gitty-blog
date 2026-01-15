import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
    <div class="posts-container">
      <h1>All Posts</h1>
      <div *ngIf="loading" class="loading">Loading posts...</div>
      <div *ngIf="!loading && posts.length === 0" class="empty">
        No posts found. Add markdown files to the /content directory.
      </div>
      <div class="posts-list" *ngIf="!loading && posts.length > 0">
        <article *ngFor="let post of posts" class="post-card">
          <h2>
            <a [routerLink]="['/post', post.path]">{{ post.title }}</a>
          </h2>
          <div class="post-meta" *ngIf="post.date || post.author">
            <span *ngIf="post.date">{{ post.date | date:'mediumDate' }}</span>
            <span *ngIf="post.author"> by {{ post.author }}</span>
          </div>
          <p class="post-excerpt" *ngIf="post.excerpt">{{ post.excerpt }}</p>
          <div class="post-tags" *ngIf="post.tags && post.tags.length > 0">
            <span *ngFor="let tag of post.tags" class="tag">{{ tag }}</span>
          </div>
        </article>
      </div>
    </div>
  `,
  styles: [`
    .posts-container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    h1 {
      margin-bottom: 2rem;
      color: #24292e;
    }
    
    .loading, .empty {
      text-align: center;
      padding: 3rem;
      color: #586069;
    }
    
    .posts-list {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    
    .post-card {
      padding: 1.5rem;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      background: white;
      transition: box-shadow 0.2s;
    }
    
    .post-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .post-card h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
    }
    
    .post-card h2 a {
      color: #0366d6;
      text-decoration: none;
    }
    
    .post-card h2 a:hover {
      text-decoration: underline;
    }
    
    .post-meta {
      color: #586069;
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }
    
    .post-excerpt {
      color: #24292e;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    
    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .tag {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #f1f3f5;
      color: #24292e;
      border-radius: 12px;
      font-size: 0.875rem;
    }
  `]
})
export class PostsComponent implements OnInit {
  posts: Post[] = [];
  loading = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<Post[]>('assets/posts.json').subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.loading = false;
      }
    });
  }
}
