import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'posts',
    loadComponent: () => import('./posts/posts.component').then(m => m.PostsComponent)
  },
  {
    path: 'post/:path',
    loadComponent: () => import('./post-detail/post-detail.component').then(m => m.PostDetailComponent)
  },
  {
    path: 'projects',
    loadComponent: () => import('./projects/projects.component').then(m => m.ProjectsComponent)
  },
  {
    path: 'project/:repo',
    loadComponent: () => import('./project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
  }
];
