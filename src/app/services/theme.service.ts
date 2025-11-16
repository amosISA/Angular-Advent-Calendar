import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Global theme service
 * Manages dark/light mode for the entire application
 * Persists theme preference in localStorage
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly _platformId = inject(PLATFORM_ID);

  // Global theme state - can be accessed by any component
  readonly isDarkMode = signal<boolean>(false);

  constructor() {
    // Only run in browser (not during SSR)
    if (isPlatformBrowser(this._platformId)) {
      // Load saved theme from localStorage
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme === 'dark') {
        this.isDarkMode.set(true);
      }

      // Apply theme class to body whenever it changes
      effect(() => {
        const dark = this.isDarkMode();
        document.body.classList.toggle('dark-mode', dark);
        localStorage.setItem('app-theme', dark ? 'dark' : 'light');
        console.log('[ThemeService] Theme changed to:', dark ? 'dark' : 'light');
      });
    }
  }

  /**
   * Toggle between dark and light mode
   */
  toggle(): void {
    this.isDarkMode.update(v => !v);
  }

  /**
   * Set specific theme
   */
  setTheme(dark: boolean): void {
    this.isDarkMode.set(dark);
  }
}
