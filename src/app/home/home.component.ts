import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home-container">
      <h1>Welcome to Gitty</h1>
      <p>A GitHub Pages based blog platform</p>
      <a routerLink="/posts" class="cta-button">Browse Posts</a>
    </div>
  `,
  styles: [`
    .home-container {
      text-align: center;
      padding: 4rem 2rem;
    }
    
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #24292e;
    }
    
    p {
      font-size: 1.25rem;
      color: #586069;
      margin-bottom: 2rem;
    }
    
    .cta-button {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: #0366d6;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      transition: background 0.2s;
    }
    
    .cta-button:hover {
      background: #0256c2;
    }
  `]
})
export class HomeComponent {}
