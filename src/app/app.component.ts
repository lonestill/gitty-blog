import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app-container">
      <header>
        <h1>Gitty</h1>
        <nav>
          <a routerLink="/" routerLinkActive="active">Home</a>
          <a routerLink="/posts" routerLinkActive="active">Posts</a>
        </nav>
      </header>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    header {
      background: #24292e;
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    header h1 {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
    }
    
    nav {
      display: flex;
      gap: 1.5rem;
    }
    
    nav a {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background 0.2s;
    }
    
    nav a:hover,
    nav a.active {
      background: rgba(255, 255, 255, 0.1);
    }
    
    main {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
  `]
})
export class AppComponent {
  title = 'Gitty';
}
