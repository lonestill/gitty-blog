import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioPlayerService {
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  
  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  private progressSubject = new BehaviorSubject<number>(0);
  private currentTimeSubject = new BehaviorSubject<string>('0:00');
  private totalTimeSubject = new BehaviorSubject<string>('0:00');
  private volumeSubject = new BehaviorSubject<number>(1);
  private isMutedSubject = new BehaviorSubject<boolean>(false);
  private bassLevelSubject = new BehaviorSubject<number>(0);
  
  public isPlaying$: Observable<boolean> = this.isPlayingSubject.asObservable();
  public progress$: Observable<number> = this.progressSubject.asObservable();
  public currentTime$: Observable<string> = this.currentTimeSubject.asObservable();
  public totalTime$: Observable<string> = this.totalTimeSubject.asObservable();
  public volume$: Observable<number> = this.volumeSubject.asObservable();
  public isMuted$: Observable<boolean> = this.isMutedSubject.asObservable();
  public bassLevel$: Observable<number> = this.bassLevelSubject.asObservable();
  
  private barHeights: number[] = [];
  private animationFrameId: number | null = null;
  
  constructor() {
    this.initializeAudio();
  }
  
  private initializeAudio() {
    if (!this.audioElement) {
      this.audioElement = new Audio('assets/content/music.mp3');
      this.audioElement.volume = 1;
      
      this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
      this.audioElement.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
      this.audioElement.addEventListener('ended', () => this.onTrackEnded());
    }
  }
  
  getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }
  
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }
  
  getDataArray(): Uint8Array | null {
    return this.dataArray;
  }
  
  getBarHeights(): number[] {
    return this.barHeights;
  }
  
  setBarHeights(heights: number[]) {
    this.barHeights = heights;
  }
  
  togglePlay() {
    if (!this.audioElement) return;
    
    if (this.isPlayingSubject.value) {
      this.audioElement.pause();
      this.isPlayingSubject.next(false);
      this.stopVisualization();
    } else {
      this.audioElement.play();
      this.isPlayingSubject.next(true);
      this.initAudioContext();
      this.startVisualization();
    }
  }
  
  private initAudioContext() {
    if (this.audioContext || !this.audioElement) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.source = this.audioContext.createMediaElementSource(this.audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }
  
  private startVisualization() {
    if (!this.analyser || !this.dataArray) return;
    
    const draw = () => {
      if (!this.analyser || !this.dataArray || !this.isPlayingSubject.value) {
        this.animationFrameId = null;
        return;
      }
      
      this.animationFrameId = requestAnimationFrame(draw);
      
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Calculate bass level
      const bassRange = Math.floor(this.dataArray.length * 0.1);
      let bassSum = 0;
      for (let i = 0; i < bassRange; i++) {
        bassSum += this.dataArray[i];
      }
      const bassLevel = bassSum / (bassRange * 255);
      this.bassLevelSubject.next(bassLevel);
    };
    
    draw();
  }
  
  private stopVisualization() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  private updateProgress() {
    if (!this.audioElement) return;
    
    if (this.audioElement.duration) {
      const percent = (this.audioElement.currentTime / this.audioElement.duration) * 100;
      this.progressSubject.next(percent);
      this.currentTimeSubject.next(this.formatTime(this.audioElement.currentTime));
    }
  }
  
  private onMetadataLoaded() {
    if (!this.audioElement) return;
    
    if (this.audioElement.duration) {
      this.totalTimeSubject.next(this.formatTime(this.audioElement.duration));
    }
  }
  
  private onTrackEnded() {
    this.isPlayingSubject.next(false);
    this.progressSubject.next(0);
    this.currentTimeSubject.next('0:00');
  }
  
  seek(percent: number) {
    if (!this.audioElement) return;
    
    if (this.audioElement.duration) {
      this.audioElement.currentTime = (percent / 100) * this.audioElement.duration;
      this.progressSubject.next(percent);
    }
  }
  
  setVolume(volume: number) {
    if (!this.audioElement) return;
    
    this.volume = volume;
    this.audioElement.volume = volume;
    this.volumeSubject.next(volume);
    
    if (volume === 0) {
      this.isMutedSubject.next(true);
    } else {
      this.isMutedSubject.next(false);
    }
  }
  
  toggleMute() {
    if (!this.audioElement) return;
    
    if (this.isMutedSubject.value) {
      const volume = this.volumeSubject.value || 0.5;
      this.setVolume(volume);
    } else {
      this.audioElement.volume = 0;
      this.isMutedSubject.next(true);
    }
  }
  
  get volume(): number {
    return this.volumeSubject.value;
  }
  
  set volume(value: number) {
    this.volumeSubject.next(value);
  }
  
  get isPlaying(): boolean {
    return this.isPlayingSubject.value;
  }
  
  get progress(): number {
    return this.progressSubject.value;
  }
  
  get currentTime(): string {
    return this.currentTimeSubject.value;
  }
  
  get totalTime(): string {
    return this.totalTimeSubject.value;
  }
  
  get isMuted(): boolean {
    return this.isMutedSubject.value;
  }
  
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  ngOnDestroy() {
    this.stopVisualization();
    if (this.audioContext) {
      this.audioContext.close();
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  }
}
