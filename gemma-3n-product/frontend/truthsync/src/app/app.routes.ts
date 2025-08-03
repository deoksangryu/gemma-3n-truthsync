import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./screens/login/login.component').then(m => m.LoginComponent) },
  { path: 'home', loadComponent: () => import('./screens/home/home.component').then(m => m.HomeComponent) },
  { path: 'camera', loadComponent: () => import('./screens/camera/camera.component').then(m => m.CameraComponent) },
  { path: 'evaluation', loadComponent: () => import('./screens/evaluation/evaluation.component').then(m => m.EvaluationComponent) },
  { path: 'post/:id', loadComponent: () => import('./screens/post-detail/post-detail.component').then(m => m.PostDetailComponent) },
  { path: 'document-editor', loadComponent: () => import('./screens/document-editor/document-editor.component').then(m => m.DocumentEditorComponent) },
];
