import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ContextProviderService } from './context-provider.service';
import { AngularIntrospectionService } from './angular-introspection.service';
import { ChatMessage } from './models';
import { firstValueFrom } from 'rxjs';

/**
 * ClaudeResponse interface matching Claude API format
 */
export interface ClaudeResponse {
  message: string;
  action: any | null;
  toolCalls?: number;
}

/**
 * ClaudeAIService
 * Integrates with Anthropic Claude API with native tool use support
 * Enables intelligent project exploration via MCP filesystem tools
 */
@Injectable({
  providedIn: 'root'
})
export class ClaudeAIService {
  private readonly _http = inject(HttpClient);
  private readonly _contextProvider = inject(ContextProviderService);
  private readonly _introspection = inject(AngularIntrospectionService);

  private readonly _apiKey = signal<string>('');
  private readonly _selectedModel = signal<string>('claude-3-5-sonnet-20241022');
  private readonly _baseUrl = 'https://api.anthropic.com/v1/messages';
  private readonly _devServerUrl = 'http://localhost:4201';

  /**
   * Set API key for Claude
   */
  setApiKey(key: string): void {
    this._apiKey.set(key);
  }

  /**
   * Set the AI model to use
   */
  setModel(modelId: string): void {
    this._selectedModel.set(modelId);
  }

  /**
   * Send message to Claude AI with tool use support
   */
  async sendMessage(message: string, conversationHistory: ChatMessage[] = []): Promise<ClaudeResponse> {
    if (!this._apiKey()) {
      throw new Error('Claude API key not set. Please configure your API key.');
    }

    try {
      const systemPrompt = this._buildSystemPrompt();
      const messages = this._buildMessages(message, conversationHistory);

      console.log('[ClaudeAI] Sending to Claude:', {
        model: this._selectedModel(),
        messageCount: messages.length,
        toolsAvailable: this._getTools().length
      });

      // Call Claude API
      let response = await this._callClaudeAPI(systemPrompt, messages);

      // Handle tool use loop
      let toolCallCount = 0;
      while (response.stop_reason === 'tool_use' && toolCallCount < 10) {
        toolCallCount++;
        console.log('[ClaudeAI] Claude requested tool use (iteration', toolCallCount, ')');

        // Execute tools and get results
        const toolResults = await this._executeTools(response.content);

        // Add assistant response and tool results to conversation
        messages.push({
          role: 'assistant',
          content: response.content
        });

        messages.push({
          role: 'user',
          content: toolResults
        });

        // Call Claude again with tool results
        response = await this._callClaudeAPI(systemPrompt, messages);
      }

      if (toolCallCount >= 10) {
        console.warn('[ClaudeAI] Tool use loop limit reached');
      }

      const parsedResponse = this._parseResponse(response);
      parsedResponse.toolCalls = toolCallCount;

      console.log('[ClaudeAI] Final response:', parsedResponse);

      return parsedResponse;
    } catch (error: any) {
      console.error('[ClaudeAI] Error:', error);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }

  /**
   * Define MCP filesystem tools for Claude
   */
  private _getTools(): unknown[] {
    return [
      {
        name: 'list_directory',
        description: 'List contents of a directory in the Angular project. Use this to explore the project structure.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path relative to project root (e.g., "src/app", "src/app/components")'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'read_file',
        description: 'Read contents of a file in the Angular project. Use this to understand existing code before creating new components.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to project root (e.g., "src/app/app.component.ts")'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'directory_tree',
        description: 'Get recursive directory tree structure (max depth 3). Use this to get an overview of project organization.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path to get tree for (e.g., "src/app")'
            }
          },
          required: ['path']
        }
      }
    ];
  }

  /**
   * Execute tool calls requested by Claude
   */
  private async _executeTools(content: any[]): Promise<any[]> {
    const toolResults: any[] = [];

    for (const block of content) {
      if (block.type === 'tool_use') {
        console.log('[ClaudeAI] Executing tool:', block.name, 'with input:', block.input);

        try {
          let result: any;

          switch (block.name) {
            case 'list_directory':
              result = await this._listDirectory(block.input.path);
              break;
            case 'read_file':
              result = await this._readFile(block.input.path);
              break;
            case 'directory_tree':
              result = await this._getDirectoryTree(block.input.path);
              break;
            default:
              result = { error: `Unknown tool: ${block.name}` };
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result, null, 2)
          });

          console.log('[ClaudeAI] Tool result:', result);
        } catch (error: any) {
          console.error('[ClaudeAI] Tool execution error:', error);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify({ error: error.message })
          });
        }
      }
    }

    return toolResults;
  }

  /**
   * List directory contents via dev server
   */
  private async _listDirectory(path: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this._http.post(`${this._devServerUrl}/api/mcp/list-directory`, { path })
      );
      return response;
    } catch (error: any) {
      throw new Error(`Failed to list directory: ${error.message}`);
    }
  }

  /**
   * Read file contents via dev server
   */
  private async _readFile(path: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this._http.post(`${this._devServerUrl}/api/mcp/read-file`, { path })
      );
      return response;
    } catch (error: any) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  /**
   * Get directory tree via dev server
   */
  private async _getDirectoryTree(path: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this._http.post(`${this._devServerUrl}/api/mcp/directory-tree`, { path })
      );
      return response;
    } catch (error: any) {
      throw new Error(`Failed to get directory tree: ${error.message}`);
    }
  }

  /**
   * Call Claude API
   */
  private async _callClaudeAPI(system: string, messages: any[]): Promise<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': this._apiKey(),
      'anthropic-version': '2023-06-01'
    });

    const body = {
      model: this._selectedModel(),
      max_tokens: 4096,
      system,
      messages,
      tools: this._getTools()
    };

    try {
      const response = await firstValueFrom(
        this._http.post(this._baseUrl, body, { headers })
      );

      return response;
    } catch (error: any) {
      if (error.error?.error?.message) {
        throw new Error(error.error.error.message);
      }
      throw error;
    }
  }

  /**
   * Build system prompt with Angular expertise
   */
  private _buildSystemPrompt(): string {
    const context = this._contextProvider.getAppContext();
    const components = this._introspection.getAllComponents();

    return `You are an EXPERT AI assistant embedded in an Angular 20 application with FULL ACCESS to the project filesystem via MCP tools.

**Current Application Context:**

Route: ${context.currentRoute}
Viewport: ${context.viewport.width}x${context.viewport.height}

**Available Components:**
${components.map(c => `- ${c.selector} (${c.name})${Object.keys(c.signals || {}).length > 0 ? ' [has signals]' : ''}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 MCP FILESYSTEM TOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You have access to MCP filesystem tools to explore the project:

1. **list_directory(path)**: List files and folders in a directory
2. **read_file(path)**: Read the contents of any file
3. **directory_tree(path)**: Get recursive directory structure

**INTELLIGENT EXPLORATION WORKFLOW:**

When a user asks you to create a component, ALWAYS:

1. **Explore first**: Use tools to understand the project structure
   - list_directory("src/app") - See app structure
   - list_directory("src/app/components") - Check existing components
   - read_file("src/app/services/theme.service.ts") - Check available services

2. **Plan the component**: Based on exploration, determine:
   - Where to place the component (src/app/components/[name])
   - What services to inject (ThemeService, etc.)
   - How to integrate with parent component

3. **Ask for confirmation**: Present your plan with EXACT file paths:
   "I'll create a navbar component with these files:
   - src/app/components/navbar/navbar.component.ts
   - src/app/components/navbar/navbar.component.html
   - src/app/components/navbar/navbar.component.scss

   And update:
   - src/app/advent-calendar/advent-calendar.component.ts (add import)
   - src/app/advent-calendar/advent-calendar.component.html (add <app-navbar />)

   Shall I proceed?"

4. **Create the component**: Once confirmed, generate the full component code

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 FILE-BASED COMPONENT CREATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Components are written to disk as REAL Angular files!

**Component Creation Format:**

{
  "message": "Your confirmation request or completion message",
  "action": {
    "type": "CREATE_FILE_COMPONENT",
    "payload": {
      "componentName": "navbar",
      "componentClassName": "NavbarComponent",
      "selector": "app-navbar",
      "componentPath": "src/app/components/navbar",
      "files": {
        "ts": "Full TypeScript component file...",
        "html": "Full HTML template...",
        "scss": "Full SCSS styles..."
      },
      "insertInto": {
        "componentFilePath": "src/app/advent-calendar/advent-calendar.component.ts",
        "importStatement": "import { NavbarComponent } from '../components/navbar/navbar.component';",
        "templatePath": "src/app/advent-calendar/advent-calendar.component.html",
        "templateInsert": {
          "position": "start",
          "content": "<app-navbar />"
        }
      }
    }
  }
}

**TypeScript Component Template:**

import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class NavbarComponent {
  private readonly _themeService = inject(ThemeService);

  readonly isDarkMode = this._themeService.isDarkMode;

  toggleTheme(): void {
    this._themeService.toggle();
  }
}

**HTML Template:**

<nav class="navbar">
  <div class="brand">My App</div>
  <button (click)="toggleTheme()">
    @if (isDarkMode()) {
      ☀️ Light Mode
    } @else {
      🌙 Dark Mode
    }
  </button>
</nav>

**SCSS Styles:**

.navbar {
  display: flex;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

**CRITICAL RULES:**

1. Use kebab-case for files: "theme-toggle", "navbar"
2. Use PascalCase for classes: "ThemeToggleComponent"
3. Always set changeDetection: ChangeDetectionStrategy.OnPush
4. Use inject() for dependencies
5. Prefix private fields with underscore: _themeService
6. Use signals for reactive state
7. Use self-closing tags: <app-navbar />
8. ALWAYS explore with tools before creating
9. ALWAYS ask for confirmation with exact paths
10. Make components beautiful and responsive

**Response Format:**

Always respond with valid JSON:

{
  "message": "Your message to the user",
  "action": {
    "type": "CREATE_FILE_COMPONENT" | "NONE",
    "payload": { ... }
  }
}

Now help the user intelligently using your filesystem tools!`;
  }

  /**
   * Build messages array for Claude API
   */
  private _buildMessages(message: string, history: ChatMessage[]): any[] {
    const messages: any[] = [];

    // Add recent history (last 10 messages)
    const recentHistory = history
      .filter(msg => msg.role !== 'system')
      .slice(-10);

    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    return messages;
  }

  /**
   * Parse Claude response
   */
  private _parseResponse(response: any): ClaudeResponse {
    try {
      // Extract text from response content
      let responseText = '';

      for (const block of response.content) {
        if (block.type === 'text') {
          responseText += block.text;
        }
      }

      console.log('[ClaudeAI] Response text:', responseText);

      // Try to parse as JSON
      try {
        // Remove markdown code blocks
        let cleanedText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

        // Try to extract JSON
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

          if (parsed.message) {
            return {
              message: parsed.message,
              action: parsed.action || null
            };
          }
        }
      } catch (parseError) {
        console.warn('[ClaudeAI] JSON parse error:', parseError);
      }

      // Fallback: use raw text
      return {
        message: responseText || 'No response',
        action: null
      };
    } catch (error) {
      console.error('[ClaudeAI] Parse error:', error);
      return {
        message: 'Error parsing response',
        action: null
      };
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return this._apiKey().length > 0;
  }

  /**
   * Get suggested questions
   */
  getSuggestedQuestions(): string[] {
    return [
      'Explore the project structure',
      'Create a navbar with dark mode toggle',
      'What components exist in this app?',
      'Add a footer component'
    ];
  }
}
