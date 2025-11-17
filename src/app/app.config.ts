import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, COMPILER_OPTIONS, CompilerFactory, Compiler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { JitCompilerFactory } from '@angular/platform-browser-dynamic';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
    // Provide JIT compiler for runtime component compilation
    { provide: COMPILER_OPTIONS, useValue: {}, multi: true },
    { provide: CompilerFactory, useClass: JitCompilerFactory, deps: [COMPILER_OPTIONS] },
    { provide: Compiler, useFactory: (compilerFactory: CompilerFactory) => compilerFactory.createCompiler(), deps: [CompilerFactory] }
  ]
};
