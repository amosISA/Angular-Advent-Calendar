import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * File system API response
 */
export interface FileSystemResponse {
  success: boolean;
  error?: string;
  [key: string]: any;
}

/**
 * File info
 */
export interface FileInfo {
  name: string;
  isDirectory: boolean;
  path: string;
}

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  command?: string;
  error?: string;
}

/**
 * FileSystemService
 * Provides file system access and command execution via dev server API
 */
@Injectable({
  providedIn: 'root'
})
export class FileSystemService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private readonly DEV_SERVER_URL = 'http://localhost:4201';

  // Signals
  readonly isDevServerAvailable = signal<boolean>(false);
  readonly lastError = signal<string | null>(null);

  constructor() {
    if (this.isBrowser) {
      this.checkDevServer();
    }
  }

  /**
   * Check if dev server is available
   */
  async checkDevServer(): Promise<boolean> {
    if (!this.isBrowser) return false;

    try {
      const response = await fetch(`${this.DEV_SERVER_URL}/api/health`, {
        method: 'GET'
      });

      const available = response.ok;
      this.isDevServerAvailable.set(available);
      return available;
    } catch (error) {
      this.isDevServerAvailable.set(false);
      return false;
    }
  }

  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<{ success: boolean; content?: string; error?: string }> {
    if (!this.isBrowser) {
      return { success: false, error: 'Not in browser environment' };
    }

    if (!this.isDevServerAvailable()) {
      return { success: false, error: 'Dev server not available. Run "npm run start:full"' };
    }

    try {
      const response = await fetch(`${this.DEV_SERVER_URL}/api/files/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });

      const data = await response.json();

      if (!data.success) {
        this.lastError.set(data.error);
      }

      return data;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to read file';
      this.lastError.set(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Write file content
   */
  async writeFile(filePath: string, content: string): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!this.isBrowser) {
      return { success: false, error: 'Not in browser environment' };
    }

    if (!this.isDevServerAvailable()) {
      return { success: false, error: 'Dev server not available. Run "npm run start:full"' };
    }

    try {
      const response = await fetch(`${this.DEV_SERVER_URL}/api/files/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, content })
      });

      const data = await response.json();

      if (!data.success) {
        this.lastError.set(data.error);
      }

      return data;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to write file';
      this.lastError.set(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * List files in directory
   */
  async listFiles(dirPath: string = 'src'): Promise<{ success: boolean; files?: FileInfo[]; error?: string }> {
    if (!this.isBrowser) {
      return { success: false, error: 'Not in browser environment' };
    }

    if (!this.isDevServerAvailable()) {
      return { success: false, error: 'Dev server not available. Run "npm run start:full"' };
    }

    try {
      const response = await fetch(`${this.DEV_SERVER_URL}/api/files/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirPath })
      });

      const data = await response.json();

      if (!data.success) {
        this.lastError.set(data.error);
      }

      return data;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to list files';
      this.lastError.set(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Get project structure
   */
  async getProjectStructure(): Promise<{ success: boolean; structure?: any; error?: string }> {
    if (!this.isBrowser) {
      return { success: false, error: 'Not in browser environment' };
    }

    if (!this.isDevServerAvailable()) {
      return { success: false, error: 'Dev server not available. Run "npm run start:full"' };
    }

    try {
      const response = await fetch(`${this.DEV_SERVER_URL}/api/files/structure`, {
        method: 'GET'
      });

      const data = await response.json();

      if (!data.success) {
        this.lastError.set(data.error);
      }

      return data;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to get project structure';
      this.lastError.set(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Execute command
   */
  async executeCommand(command: string, args: string[] = []): Promise<CommandResult> {
    if (!this.isBrowser) {
      return { success: false, error: 'Not in browser environment' };
    }

    if (!this.isDevServerAvailable()) {
      return { success: false, error: 'Dev server not available. Run "npm run start:full"' };
    }

    try {
      const response = await fetch(`${this.DEV_SERVER_URL}/api/commands/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, args })
      });

      const data = await response.json();

      if (!data.success) {
        this.lastError.set(data.error || data.stderr);
      }

      return data;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to execute command';
      this.lastError.set(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(filePath: string): Promise<{ success: boolean; stats?: any; error?: string }> {
    if (!this.isBrowser) {
      return { success: false, error: 'Not in browser environment' };
    }

    if (!this.isDevServerAvailable()) {
      return { success: false, error: 'Dev server not available. Run "npm run start:full"' };
    }

    try {
      const response = await fetch(`${this.DEV_SERVER_URL}/api/files/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });

      const data = await response.json();

      if (!data.success) {
        this.lastError.set(data.error);
      }

      return data;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to get file stats';
      this.lastError.set(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Convenience method: Build the project
   */
  async build(): Promise<CommandResult> {
    return this.executeCommand('ng', ['build']);
  }

  /**
   * Convenience method: Run tests
   */
  async test(): Promise<CommandResult> {
    return this.executeCommand('ng', ['test', '--watch=false']);
  }

  /**
   * Convenience method: Get route definitions
   */
  async getRoutes(): Promise<{ success: boolean; routes?: string; error?: string }> {
    const result = await this.readFile('src/app/app.routes.ts');
    if (result.success && result.content) {
      return { success: true, routes: result.content };
    }
    return { success: false, error: result.error };
  }
}
