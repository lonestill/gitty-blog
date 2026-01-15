import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { AudioPlayerService } from './audio-player.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="app-container">
      <header [class.hidden]="headerHidden" [class.scrolled]="isScrolled">
        <div class="header-content">
          <a routerLink="/" class="logo">Gitty</a>
          <nav>
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
            <a routerLink="/posts" routerLinkActive="active">Posts</a>
            <a routerLink="/projects" routerLinkActive="active">Projects</a>
          </nav>
        </div>
        <div class="mini-player" *ngIf="showMiniPlayer">
          <div class="mini-player-content">
            <div class="mini-track-info">
              <div class="mini-track-title">A Star Called the Sun</div>
              <div class="mini-track-artist">Kino</div>
            </div>
            <div class="mini-player-controls">
              <button class="mini-play-pause-btn" (click)="togglePlay()" [attr.aria-label]="isPlaying ? 'Pause' : 'Play'">
                <span *ngIf="!isPlaying">▶</span>
                <span *ngIf="isPlaying">⏸</span>
              </button>
              <div class="mini-progress-bar" (click)="seek($event)">
                <div class="mini-progress-filled" [style.width.%]="progress"></div>
              </div>
              <div class="mini-time">{{ currentTime }} / {{ totalTime }}</div>
            </div>
          </div>
        </div>
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
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--color-border);
      z-index: 1000;
      transition: transform var(--transition-slow), opacity var(--transition-slow);
      transform: translateY(0);
      opacity: 1;
    }
    
    header.hidden {
      transform: translateY(-100%);
      opacity: 0;
      pointer-events: none;
    }
    
    header.scrolled {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.25rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      font-size: var(--font-size-lg);
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--color-text);
      transition: opacity var(--transition-base);
      cursor: pointer;
    }
    
    .logo:hover {
      opacity: 0.7;
    }
    
    nav {
      display: flex;
      gap: 2rem;
      align-items: center;
    }
    
    nav a {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
      padding: 0.5rem 0;
      position: relative;
      transition: color var(--transition-base);
      cursor: pointer;
    }
    
    nav a::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 1px;
      background: var(--color-text);
      transition: width var(--transition-base);
    }
    
    nav a:hover,
    nav a.active {
      color: var(--color-text);
    }
    
    nav a:hover::after,
    nav a.active::after {
      width: 100%;
    }
    
    .mini-player {
      border-top: 1px solid var(--color-border);
      background: rgba(0, 0, 0, 0.98);
      padding: 0.75rem 2rem;
    }
    
    .mini-player-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    
    .mini-track-info {
      flex-shrink: 0;
      min-width: 0;
    }
    
    .mini-track-title {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0.125rem;
    }
    
    .mini-track-artist {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .mini-player-controls {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
      min-width: 0;
    }
    
    .mini-play-pause-btn {
      width: 2rem;
      height: 2rem;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-base);
      font-size: 0.75rem;
      flex-shrink: 0;
    }
    
    .mini-play-pause-btn:hover {
      border-color: var(--color-text);
      background: rgba(255, 255, 255, 0.02);
    }
    
    .mini-progress-bar {
      flex: 1;
      position: relative;
      height: 0.25rem;
      background: var(--color-border);
      border-radius: 0.125rem;
      cursor: pointer;
      transition: height var(--transition-base);
      min-width: 100px;
    }
    
    .mini-progress-bar:hover {
      height: 0.375rem;
    }
    
    .mini-progress-filled {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: var(--color-text);
      border-radius: 0.125rem;
      transition: width 0.1s linear;
    }
    
    .mini-time {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      white-space: nowrap;
      flex-shrink: 0;
    }
    
    @media (max-width: 768px) {
      .mini-player {
        padding: 0.75rem 1.5rem;
      }
      
      .mini-player-content {
        gap: 1rem;
      }
      
      .mini-track-info {
        display: none;
      }
      
      .mini-time {
        font-size: 0.625rem;
      }
    }
    
    main {
      flex: 1;
      padding-top: 6rem;
      max-width: 800px;
      margin: 0 auto;
      width: 100%;
      padding-left: 2rem;
      padding-right: 2rem;
      padding-bottom: 4rem;
    }
    
    @media (max-width: 768px) {
      .header-content {
        padding: 1rem 1.5rem;
      }
      
      main {
        padding-top: 5rem;
        padding-left: 1.5rem;
        padding-right: 1.5rem;
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  isScrolled = false;
  headerHidden = false;
  lastScrollY = 0;
  private scrollThreshold = 100;
  private routerSubscription?: Subscription;
  
  showMiniPlayer = false;
  isPlaying = false;
  progress = 0;
  currentTime = '0:00';
  totalTime = '0:00';
  private audioSubscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private audioPlayerService: AudioPlayerService
  ) {}

  ngOnInit() {
    // Hide header on route change
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.headerHidden = false;
        // Show mini player if music is playing and not on home page
        if (event instanceof NavigationEnd) {
          this.updateMiniPlayerVisibility(event.url);
        }
      });
    
    // Subscribe to audio player state
    this.audioSubscriptions.push(
      this.audioPlayerService.isPlaying$.subscribe(isPlaying => {
        this.isPlaying = isPlaying;
        this.updateMiniPlayerVisibility(this.router.url);
      })
    );
    
    this.audioSubscriptions.push(
      this.audioPlayerService.progress$.subscribe(progress => {
        this.progress = progress;
      })
    );
    
    this.audioSubscriptions.push(
      this.audioPlayerService.currentTime$.subscribe(time => {
        this.currentTime = time;
      })
    );
    
    this.audioSubscriptions.push(
      this.audioPlayerService.totalTime$.subscribe(time => {
        this.totalTime = time;
      })
    );
    
    // Initial check
    this.updateMiniPlayerVisibility(this.router.url);
  }
  
  private updateMiniPlayerVisibility(url: string) {
    const isHomePage = url === '/' || url === '/#';
    this.showMiniPlayer = this.audioPlayerService.isPlaying && !isHomePage;
  }
  
  togglePlay() {
    this.audioPlayerService.togglePlay();
  }
  
  seek(event: MouseEvent) {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percent = (clickX / rect.width) * 100;
    this.audioPlayerService.seek(percent);
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
    this.audioSubscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentScrollY = window.scrollY;
    
    this.isScrolled = currentScrollY > 20;
    
    // Hide/show header based on scroll direction
    if (currentScrollY > this.scrollThreshold) {
      if (currentScrollY > this.lastScrollY && currentScrollY > 200) {
        // Scrolling down - hide header
        this.headerHidden = true;
      } else {
        // Scrolling up - show header
        this.headerHidden = false;
      }
    } else {
      this.headerHidden = false;
    }
    
    this.lastScrollY = currentScrollY;
  }
}
