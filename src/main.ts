import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Import compiler to enable JIT compilation in production
// This is required for runtime component compilation
import '@angular/compiler';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
