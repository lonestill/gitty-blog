import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AudioPlayerService } from '../audio-player.service';
import { Subscription } from 'rxjs';

interface Post {
  path: string;
  title: string;
  date?: string;
  author?: string;
  tags?: string[];
  category?: string;
  excerpt?: string;
}

interface Project {
  name: string;
  description?: string;
  url?: string;
  year?: string;
  tech?: string[];
  repo?: string;
}

interface Track {
  title: string;
  artist: string;
  file?: string;
}

// Удаляем интерфейс Particle, используем волновые эффекты


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="home-container">
      <div class="top-section">
        <section class="hero">
          <h1 class="hero-title">lonestill</h1>
          <p class="hero-description">
            sinking into lonely and stillness
          </p>
          <div class="hero-links">
            <a href="https://github.com/lonestill" target="_blank" rel="noopener noreferrer">GitHub</a>
            <span class="separator">/</span>
            <a href="#" target="_blank" rel="noopener noreferrer">Twitter</a>
          </div>
        </section>

        <section class="stats" *ngIf="!loading">
          <div class="stat-item">
            <span class="stat-value">{{ totalPosts }}</span>
            <span class="stat-label">Posts</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ totalProjects }}</span>
            <span class="stat-label">Projects</span>
          </div>
        </section>
      </div>

      

      <div class="content-grid">
        <section class="latest-post" *ngIf="!loading && latestPost">
          <div class="section-header">
            <h2 class="section-title">Latest Post</h2>
            <a routerLink="/posts" class="view-all">All →</a>
          </div>
          <article class="post-card">
            <div class="post-header">
              <h3 class="post-title">
                <a [routerLink]="['/post', latestPost.path]">{{ latestPost.title }}</a>
              </h3>
              <div class="post-meta" *ngIf="latestPost.date">
                <time [attr.datetime]="latestPost.date">{{ latestPost.date | date:'MMM d, y' }}</time>
              </div>
            </div>
            <div class="post-tags" *ngIf="latestPost.tags && latestPost.tags.length > 0">
              <a 
                *ngFor="let tag of latestPost.tags" 
                [routerLink]="['/posts']" 
                [queryParams]="{tag: tag}"
                class="tag">
                {{ tag }}
              </a>
            </div>
          </article>
        </section>

        <section class="latest-projects" *ngIf="!loading && latestProjects.length > 0">
          <div class="section-header">
            <h2 class="section-title">Projects</h2>
            <a routerLink="/projects" class="view-all">All →</a>
          </div>
          <div class="projects-list">
            <article *ngFor="let project of latestProjects" class="project-card">
              <h3 class="project-title">
                <a *ngIf="project.repo" [routerLink]="['/project', project.repo]">{{ project.name }}</a>
                <span *ngIf="!project.repo">{{ project.name }}</span>
              </h3>
              <p class="project-description" *ngIf="project.description">{{ project.description }}</p>
              <div class="project-tech" *ngIf="project.tech && project.tech.length > 0">
                <span *ngFor="let tech of project.tech" class="tech-tag">{{ tech }}</span>
              </div>
            </article>
          </div>
        </section>
      </div>

      <section class="audio-player" [class.playing]="isPlaying" *ngIf="!loading">
        <div class="player-container">
          <div class="track-info">
            <div class="track-title">A Star Called the Sun</div>
            <div class="track-artist">Kino</div>
          </div>
          <div class="visualization-container">
            <canvas #visualizationCanvas class="visualization-canvas"></canvas>
          </div>
          <div class="player-controls">
            <button class="play-pause-btn" (click)="togglePlay()" [attr.aria-label]="isPlaying ? 'Pause' : 'Play'">
              <span *ngIf="!isPlaying">▶</span>
              <span *ngIf="isPlaying">⏸</span>
            </button>
            <div class="player-info">
              <div class="player-progress">
                <div class="progress-bar" (click)="seek($event)">
                  <div class="progress-filled" [style.width.%]="progressPercent"></div>
                  <div class="progress-handle" [style.left.%]="progressPercent"></div>
                </div>
                <div class="time-info">
                  <span class="current-time">{{ currentTime }}</span>
                  <span class="total-time">{{ totalTime }}</span>
                </div>
              </div>
            </div>
            <div class="volume-control">
              <button class="volume-btn" (click)="toggleMute()" [attr.aria-label]="isMuted ? 'Unmute' : 'Mute'">
                <span *ngIf="isMuted || volume === 0">○</span>
                <span *ngIf="!isMuted && volume > 0 && volume < 0.5">◉</span>
                <span *ngIf="!isMuted && volume >= 0.5">●</span>
              </button>
              <div class="volume-slider-container">
                <div class="volume-progress-bar" (click)="seekVolume($event)">
                  <div class="volume-progress-filled" [style.width.%]="volume * 100"></div>
                  <div class="volume-progress-handle" [style.left.%]="volume * 100"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div *ngIf="loading" class="loading">
        <div class="loading-text">Loading...</div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      width: 100%;
    }
    
    .top-section {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 4rem;
      align-items: start;
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
    }
    
    .hero {
      min-width: 0;
    }
    
    .hero-title {
      font-size: var(--font-size-2xl);
      font-weight: 600;
      line-height: var(--line-height-tight);
      letter-spacing: -0.03em;
      margin: 0 0 0.75rem 0;
      color: var(--color-text);
    }
    
    .hero-description {
      font-size: var(--font-size-base);
      line-height: var(--line-height-relaxed);
      color: var(--color-text-secondary);
      margin: 0 0 1.25rem 0;
      max-width: 500px;
    }
    
    .hero-links {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: var(--font-size-sm);
      color: var(--color-text);
    }
    
    .hero-links a {
      color: var(--color-text);
      text-decoration: none;
      transition: opacity var(--transition-base);
      cursor: pointer;
      font-weight: 500;
    }
    
    .hero-links a:hover {
      opacity: 0.6;
    }
    
    .separator {
      color: var(--color-text-muted);
      font-weight: 300;
    }
    
    .stats {
      display: flex;
      gap: 2.5rem;
      flex-shrink: 0;
    }
    
    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      align-items: flex-end;
    }
    
    .stat-value {
      font-size: var(--font-size-xl);
      font-weight: 600;
      line-height: var(--line-height-tight);
      letter-spacing: -0.02em;
      color: var(--color-text);
    }
    
    .stat-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 500;
    }
    
    .about {
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
    }
    
    .about-text {
      font-size: var(--font-size-sm);
      line-height: var(--line-height-relaxed);
      color: var(--color-text-secondary);
      margin: 0;
      max-width: 600px;
    }
    
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      margin-bottom: var(--spacing-md);
    }
    
    .latest-post {
      min-width: 0;
    }
    
    .latest-projects {
      min-width: 0;
    }
    
    .projects-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .project-card {
      padding-bottom: 1.5rem;
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
    
    .project-title {
      margin: 0 0 0.5rem 0;
      font-size: var(--font-size-base);
      font-weight: 600;
      line-height: var(--line-height-tight);
      letter-spacing: -0.01em;
    }
    
    .project-title a {
      color: var(--color-text);
      text-decoration: none;
      transition: opacity var(--transition-base);
      cursor: pointer;
    }
    
    .project-title a:hover {
      opacity: 0.7;
    }
    
    .project-title span {
      color: var(--color-text);
    }
    
    .project-description {
      color: var(--color-text-secondary);
      line-height: var(--line-height-relaxed);
      margin: 0 0 0.75rem 0;
      font-size: var(--font-size-xs);
    }
    
    .project-tech {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .tech-tag {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      background: transparent;
      color: var(--color-text-muted);
      border: 1px solid var(--color-border);
      border-radius: 2px;
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }
    
    .section-title {
      font-size: var(--font-size-xl);
      font-weight: 600;
      line-height: var(--line-height-tight);
      letter-spacing: -0.02em;
      margin: 0;
      color: var(--color-text);
    }
    
    .view-all {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
      transition: color var(--transition-base);
      cursor: pointer;
      white-space: nowrap;
    }
    
    .view-all:hover {
      color: var(--color-text);
    }
    
    .post-card {
      transition: opacity var(--transition-base);
    }
    
    .post-card:hover {
      opacity: 0.8;
    }
    
    .post-header {
      margin-bottom: 1rem;
    }
    
    .post-title {
      margin: 0 0 0.5rem 0;
      font-size: var(--font-size-lg);
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
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
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
    }
    
    .tag:hover {
      color: var(--color-text);
      border-color: var(--color-text);
    }
    
    .now-playing {
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
    }
    
    .now-playing-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .equalizer {
      display: flex;
      align-items: flex-end;
      gap: 0.2rem;
      height: 1.5rem;
      min-width: 2rem;
    }
    
    .bar {
      width: 0.2rem;
      background: var(--color-text);
      border-radius: 0.1rem;
      animation: equalizer 1.2s ease-in-out infinite;
      opacity: 0.6;
    }
    
    .bar:nth-child(1) {
      animation-delay: 0s;
    }
    
    .bar:nth-child(2) {
      animation-delay: 0.1s;
    }
    
    .bar:nth-child(3) {
      animation-delay: 0.2s;
    }
    
    .bar:nth-child(4) {
      animation-delay: 0.3s;
    }
    
    .bar:nth-child(5) {
      animation-delay: 0.4s;
    }
    
    @keyframes equalizer {
      0%, 100% {
        height: 20%;
      }
      50% {
        height: 100%;
      }
    }
    
    .track-info {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      flex-wrap: wrap;
      font-size: var(--font-size-sm);
    }
    
    .label {
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: var(--font-size-xs);
      font-weight: 500;
    }
    
    .track-name {
      color: var(--color-text);
      font-weight: 500;
    }
    
    .track-artist {
      color: var(--color-text-secondary);
    }
    
    .track-artist::before {
      content: '—';
      margin-right: 0.5rem;
      color: var(--color-text-muted);
    }
    
    .audio-player {
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
      position: relative;
      transition: background-color 0.05s ease-out;
      border-radius: 4px;
      padding: 1.5rem;
      display: flex;
      justify-content: center;
    }
    
    .player-container {
      max-width: 600px;
      width: 100%;
    }
    
    .track-info {
      margin-bottom: 1rem;
    }
    
    .track-title {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 0.25rem;
    }
    
    .track-artist {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }
    
    .visualization-container {
      width: 100%;
      height: 120px;
      margin-bottom: 1.5rem;
      overflow: hidden;
      background: #000000;
    }
    
    .visualization-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    
    .player-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .play-pause-btn {
      width: 2.5rem;
      height: 2.5rem;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-base);
      font-size: 0.875rem;
      flex-shrink: 0;
    }
    
    .play-pause-btn:hover {
      border-color: var(--color-text);
      background: rgba(255, 255, 255, 0.02);
    }
    
    .player-info {
      flex: 1;
      min-width: 0;
    }
    
    .player-progress {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .progress-bar {
      position: relative;
      width: 100%;
      height: 0.25rem;
      background: var(--color-border);
      border-radius: 0.125rem;
      cursor: pointer;
      transition: height var(--transition-base);
    }
    
    .progress-bar:hover {
      height: 0.375rem;
    }
    
    .progress-filled {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: var(--color-text);
      border-radius: 0.125rem;
      transition: width 0.1s linear;
    }
    
    .progress-handle {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 0.75rem;
      height: 0.75rem;
      background: var(--color-text);
      border-radius: 50%;
      opacity: 0;
      transition: opacity var(--transition-base);
      pointer-events: none;
    }
    
    .progress-bar:hover .progress-handle {
      opacity: 1;
    }
    
    .time-info {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }
    
    .volume-control {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }
    
    .volume-btn {
      width: 2rem;
      height: 2rem;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-base);
      font-size: 0.875rem;
      flex-shrink: 0;
      font-family: monospace;
    }
    
    .volume-btn:hover {
      border-color: var(--color-text);
      background: rgba(255, 255, 255, 0.02);
    }
    
    .volume-slider-container {
      flex: 1;
      display: flex;
      align-items: center;
    }
    
    .volume-progress-bar {
      position: relative;
      width: 100%;
      height: 0.25rem;
      background: var(--color-border);
      border-radius: 0.125rem;
      cursor: pointer;
      transition: height var(--transition-base);
    }
    
    .volume-progress-bar:hover {
      height: 0.375rem;
    }
    
    .volume-progress-filled {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: var(--color-text);
      border-radius: 0.125rem;
      transition: width 0.1s linear;
    }
    
    .volume-progress-handle {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 0.75rem;
      height: 0.75rem;
      background: var(--color-text);
      border-radius: 50%;
      opacity: 0;
      transition: opacity var(--transition-base);
      pointer-events: none;
    }
    
    .volume-progress-bar:hover .volume-progress-handle {
      opacity: 1;
    }
    
    .timeline {
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
    }
    
    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 3rem;
      position: relative;
    }
    
    .timeline-year {
      display: flex;
      gap: 2rem;
      position: relative;
    }
    
    .timeline-year:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 1.5rem;
      top: 2.5rem;
      bottom: -3rem;
      width: 1px;
      background: var(--color-border);
    }
    
    .year-label {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-text);
      min-width: 3rem;
      flex-shrink: 0;
      padding-top: 0.25rem;
      position: relative;
      padding-left: 0.5rem;
    }
    
    .year-label::before {
      content: '';
      position: absolute;
      left: -0.5rem;
      top: 0.5rem;
      width: 0.5rem;
      height: 0.5rem;
      background: var(--color-text);
      border-radius: 50%;
    }
    
    .year-posts {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      padding-left: 1rem;
      border-left: 1px solid var(--color-border);
    }
    
    .timeline-month {
      display: flex;
      gap: 1.5rem;
      position: relative;
    }
    
    .timeline-month::before {
      content: '';
      position: absolute;
      left: -1.5rem;
      top: 0.5rem;
      width: 0.375rem;
      height: 0.375rem;
      background: var(--color-text-secondary);
      border-radius: 50%;
      border: 1px solid var(--color-border);
    }
    
    .month-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 500;
      min-width: 4rem;
      flex-shrink: 0;
      padding-top: 0.25rem;
    }
    
    .month-posts {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .timeline-post {
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: var(--font-size-sm);
      transition: all var(--transition-base);
      cursor: pointer;
      padding: 0.25rem 0;
      position: relative;
      padding-left: 1rem;
    }
    
    .timeline-post::before {
      content: '—';
      position: absolute;
      left: 0;
      color: var(--color-text-muted);
      opacity: 0.5;
    }
    
    .timeline-post:hover {
      color: var(--color-text);
      padding-left: 1.25rem;
    }
    
    .timeline-post:hover::before {
      opacity: 1;
    }
    
    .popular-tags {
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
    }
    
    .tags-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    
    .tag-large {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: transparent;
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: 2px;
      font-size: var(--font-size-sm);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
      transition: all var(--transition-base);
      cursor: pointer;
      text-decoration: none;
    }
    
    .tag-large:hover {
      border-color: var(--color-text);
      background: rgba(255, 255, 255, 0.02);
    }
    
    .tag-count {
      color: var(--color-text-muted);
      font-weight: 400;
      font-size: var(--font-size-xs);
    }
    
    .loading {
      text-align: center;
      padding: var(--spacing-xl) 0;
    }
    
    .loading-text {
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
      }
    }
    
    @media (max-width: 768px) {
      .top-section {
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-md);
      }
      
      .hero-title {
        font-size: var(--font-size-xl);
      }
      
      .hero-description {
        font-size: var(--font-size-sm);
      }
      
      .stats {
        gap: 2rem;
        justify-content: flex-start;
      }
      
      .stat-item {
        align-items: flex-start;
      }
      
      .stat-value {
        font-size: var(--font-size-lg);
      }
      
      .about {
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-md);
      }
      
      .content-grid {
        gap: var(--spacing-md);
      }
      
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        margin-bottom: 1rem;
      }
      
      .post-title {
        font-size: var(--font-size-base);
      }
      
      .projects-list {
        gap: 1rem;
      }
    }
  `]
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('visualizationCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  
  posts: Post[] = [];
  latestPost: Post | null = null;
  projects: Project[] = [];
  latestProjects: Project[] = [];
  isPlaying = false;
  progressPercent = 0;
  currentTime = '0:00';
  totalTime = '0:00';
  volume = 1;
  isMuted = false;
  totalPosts = 0;
  totalProjects = 0;
  loading = true;
  
  private animationFrameId: number | null = null;
  private bassLevel = 0;
  private subscriptions: Subscription[] = [];

  constructor(
    private http: HttpClient,
    private audioPlayerService: AudioPlayerService
  ) {}

  ngOnInit() {
    // Get initial state from service
    this.isPlaying = this.audioPlayerService.isPlaying;
    this.progressPercent = this.audioPlayerService.progress;
    this.currentTime = this.audioPlayerService.currentTime;
    this.totalTime = this.audioPlayerService.totalTime;
    this.volume = this.audioPlayerService.volume;
    this.isMuted = this.audioPlayerService.isMuted;
    
    // Subscribe to audio player service
    this.subscriptions.push(
      this.audioPlayerService.isPlaying$.subscribe(isPlaying => {
        this.isPlaying = isPlaying;
        if (isPlaying) {
          // Use setTimeout to ensure canvas is ready
          setTimeout(() => {
            if (this.canvas) {
              this.startVisualization();
            }
          }, 0);
        } else {
          this.stopVisualization();
        }
      })
    );
    
    this.subscriptions.push(
      this.audioPlayerService.progress$.subscribe(progress => {
        this.progressPercent = progress;
      })
    );
    
    this.subscriptions.push(
      this.audioPlayerService.currentTime$.subscribe(time => {
        this.currentTime = time;
      })
    );
    
    this.subscriptions.push(
      this.audioPlayerService.totalTime$.subscribe(time => {
        this.totalTime = time;
      })
    );
    
    this.subscriptions.push(
      this.audioPlayerService.volume$.subscribe(volume => {
        this.volume = volume;
      })
    );
    
    this.subscriptions.push(
      this.audioPlayerService.isMuted$.subscribe(isMuted => {
        this.isMuted = isMuted;
      })
    );
    
    // Initialize audio if not already initialized
    const audioElement = this.audioPlayerService.getAudioElement();
    if (audioElement) {
      this.onMetadataLoaded();
    }
    
    // Load posts
    this.http.get<Post[]>('assets/posts.json').subscribe({
      next: (data) => {
        this.posts = data;
        this.totalPosts = data.length;
        // Show only latest post on home page
        this.latestPost = data.length > 0 ? data[0] : null;
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.checkLoadingComplete();
      }
    });

    // Load projects
    this.http.get<Project[]>('assets/projects.json').subscribe({
      next: (data) => {
        this.projects = data;
        this.totalProjects = data.length;
        // Show latest 3 projects
        this.latestProjects = data.slice(0, 3);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.warn('Projects file not found, using empty array');
        this.checkLoadingComplete();
      }
    });
  }

  ngAfterViewInit() {
    // View initialized
    // Setup canvas and restore visualization if music is playing
    this.onMetadataLoaded();
    
    // If music is already playing, start visualization
    if (this.isPlaying) {
      this.startVisualization();
    }
  }

  togglePlay() {
    this.audioPlayerService.togglePlay();
  }

  startVisualization() {
    if (!this.canvas) {
      // Canvas not ready yet, try again after a short delay
      setTimeout(() => this.startVisualization(), 100);
      return;
    }
    
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Ensure canvas is properly sized
    const rect = canvas.getBoundingClientRect();
    if (canvas.width === 0 || canvas.height === 0 || rect.width !== canvas.width / window.devicePixelRatio) {
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    const width = rect.width;
    const height = rect.height;
    
    // Get bar heights from service or initialize
    let barHeights = this.audioPlayerService.getBarHeights();
    if (barHeights.length === 0) {
      barHeights = new Array(80).fill(0);
      this.audioPlayerService.setBarHeights(barHeights);
    }
    
    const draw = () => {
      const analyser = this.audioPlayerService.getAnalyser();
      const dataArray = this.audioPlayerService.getDataArray();
      
      if (!analyser || !dataArray || !this.isPlaying) {
        this.animationFrameId = null;
        return;
      }
      
      this.animationFrameId = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      barHeights = this.audioPlayerService.getBarHeights();
      
      // Calculate frequency levels for different ranges
      const totalBins = dataArray.length;
      
      // Bass: 0-10% (низкие частоты)
      const bassRange = Math.floor(totalBins * 0.1);
      let bassSum = 0;
      for (let i = 0; i < bassRange; i++) {
        bassSum += dataArray[i];
      }
      const bassLevel = bassSum / (bassRange * 255);
      this.bassLevel = bassLevel; // Keep for backward compatibility
      
      // Mid: 10-50% (средние частоты)
      const midStart = bassRange;
      const midEnd = Math.floor(totalBins * 0.5);
      let midSum = 0;
      for (let i = midStart; i < midEnd; i++) {
        midSum += dataArray[i];
      }
      const midLevel = midSum / ((midEnd - midStart) * 255);
      
      // Treble: 50-100% (высокие частоты)
      const trebleStart = midEnd;
      let trebleSum = 0;
      for (let i = trebleStart; i < totalBins; i++) {
        trebleSum += dataArray[i];
      }
      const trebleLevel = trebleSum / ((totalBins - trebleStart) * 255);
      
      // Update background pulse intensity
      this.updateBackgroundPulse();
      
      // Clear with slight fade for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, width, height);
      
      const barCount = 80;
      const barWidth = width / barCount;
      const barGap = barWidth * 0.15;
      const actualBarWidth = barWidth - barGap;
      const centerY = height / 2;
      
      // Initialize bar heights array if needed
      if (barHeights.length !== barCount) {
        barHeights = new Array(barCount).fill(0);
        this.audioPlayerService.setBarHeights(barHeights);
      }
      
      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * dataArray.length);
        const rawValue = dataArray[dataIndex] / 255;
        
        // Smooth falloff - new value blends with old
        const targetHeight = rawValue * height * 0.9;
        barHeights[i] = barHeights[i] * 0.7 + targetHeight * 0.3;
        
        const barHeight = barHeights[i];
        const x = i * barWidth + barGap / 2;
        
        // White color scheme matching site style
        const color1 = 'rgba(255, 255, 255, 1)';
        const color2 = 'rgba(255, 255, 255, 0.6)';
        const color3 = 'rgba(255, 255, 255, 0.2)';
        
        // Draw top bar (above center)
        const topY = centerY - barHeight / 2;
        const gradient = ctx.createLinearGradient(x, topY, x, centerY);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(0.5, color2);
        gradient.addColorStop(1, color3);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, topY, actualBarWidth, barHeight / 2, 2);
        ctx.fill();
        
        // Draw bottom bar (below center, mirrored)
        const bottomY = centerY;
        const gradientBottom = ctx.createLinearGradient(x, bottomY, x, centerY + barHeight / 2);
        gradientBottom.addColorStop(0, color3);
        gradientBottom.addColorStop(0.5, color2);
        gradientBottom.addColorStop(1, color1);
        
        ctx.fillStyle = gradientBottom;
        ctx.beginPath();
        ctx.roundRect(x, bottomY, actualBarWidth, barHeight / 2, 2);
        ctx.fill();
        
        // Add glow effect for active bars
        if (rawValue > 0.5) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = color1;
          ctx.fillStyle = color1;
          ctx.beginPath();
          ctx.roundRect(x, topY, actualBarWidth, barHeight / 2, 2);
          ctx.fill();
          ctx.beginPath();
          ctx.roundRect(x, bottomY, actualBarWidth, barHeight / 2, 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      
      // Update bar heights in service
      this.audioPlayerService.setBarHeights(barHeights);
      
      // Draw center line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
    };
    
    draw();
  }

  updateBackgroundPulse() {
    // Background pulse removed
  }

  stopVisualization() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.canvas) {
      const canvas = this.canvas.nativeElement;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }


  onMetadataLoaded() {
    // Setup canvas size
    if (this.canvas) {
      const canvas = this.canvas.nativeElement;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, rect.width, rect.height);
        
        // Add roundRect polyfill if not available
        if (!ctx.roundRect) {
          (ctx as any).roundRect = function(x: number, y: number, w: number, h: number, r: number) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.beginPath();
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            this.closePath();
            return this;
          };
        }
      }
    }
  }

  seek(event: MouseEvent) {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percent = (clickX / rect.width) * 100;
    this.audioPlayerService.seek(percent);
  }

  toggleMute() {
    this.audioPlayerService.toggleMute();
  }

  seekVolume(event: MouseEvent) {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    this.audioPlayerService.setVolume(percent / 100);
  }

  ngOnDestroy() {
    this.stopVisualization();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }


  checkLoadingComplete() {
    // Both requests should complete, but we'll set loading to false after both
    if (!this.loading) return;
    this.loading = false;
  }

  trackByPath(index: number, post: Post): string {
    return post.path;
  }
}
