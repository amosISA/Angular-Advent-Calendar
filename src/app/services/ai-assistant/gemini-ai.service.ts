import { Injectable, inject, signal } from '@angular/core';
import { ContextProviderService } from './context-provider.service';
import { AngularIntrospectionService } from './angular-introspection.service';
import { ChatMessage, GeminiResponse, AIAction } from './models';

/**
 * GeminiAIService
 * Integrates with Google Gemini AI API
 * Provides context-aware responses about the Angular application
 */
@Injectable({
  providedIn: 'root'
})
export class GeminiAIService {
  private contextProvider = inject(ContextProviderService);
  private introspection = inject(AngularIntrospectionService);

  private apiKey = signal<string>('');
  private selectedModel = signal<string>('gemini-2.5-flash');
  private readonly BASE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

  /**
   * Set API key for Gemini
   */
  setApiKey(key: string): void {
    this.apiKey.set(key);
  }

  /**
   * Set the AI model to use
   */
  setModel(modelId: string): void {
    this.selectedModel.set(modelId);
  }

  /**
   * Get the full API URL for the selected model
   */
  private getApiUrl(): string {
    return `${this.BASE_API_URL}${this.selectedModel()}:generateContent`;
  }

  /**
   * Send message to Gemini AI with application context
   */
  async sendMessage(message: string, conversationHistory: ChatMessage[] = []): Promise<GeminiResponse> {
    if (!this.apiKey()) {
      throw new Error('Gemini API key not set. Please configure your API key.');
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      const fullPrompt = this.buildFullPrompt(message, conversationHistory, systemPrompt);

      const response = await this.callGeminiAPI(fullPrompt);
      const parsedResponse = this.parseResponse(response);

      return parsedResponse;
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }

  /**
   * Build system prompt with current app context
   */
  private buildSystemPrompt(): string {
    const context = this.contextProvider.getAppContext();
    const components = this.introspection.getAllComponents();

    return `You are an EXPERT AI assistant embedded in an Angular 20 application with DEEP knowledge of Angular's build system, component architecture, and runtime compilation.

**Current Application Context:**

Route: ${context.currentRoute}
Viewport: ${context.viewport.width}x${context.viewport.height}

**Available Components:**
${components.map(c => `- ${c.selector} (${c.name})${Object.keys(c.signals || {}).length > 0 ? ' [has signals]' : ''}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 ANGULAR COMPILATION EXPERT MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You have the POWER to CREATE ANGULAR COMPONENTS AT RUNTIME!

**Your Angular Expertise:**

You understand:
- Angular component architecture and @Component decorator
- Template syntax: interpolation {{ }}, property binding [], event binding (), two-way binding [()]
- Structural directives: @if, @for, @switch
- Signals and reactive state management
- Standalone components (imports array)
- TypeScript for component logic
- CSS/SCSS styling
- Angular's JIT compilation process
- Component lifecycle hooks

**Your Capabilities:**

1. **CREATE COMPONENTS**: Generate complete Angular components from scratch
2. **List Components**: Show all components on the current page
3. **Highlight Components**: Visually highlight specific components
4. **Inspect Elements**: Enable element inspector mode
5. **Modify Properties**: Change component properties at runtime
6. **Change Styles**: Modify CSS styles dynamically

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**CREATING COMPONENTS AT RUNTIME:**

When user asks you to create a component (e.g., "create a Christmas story", "make a quiz component"), use the CREATE_COMPONENT action!

**Component Structure:**
{
  "selector": "app-dynamic-component",
  "name": "DynamicComponent",
  "template": \`HTML template with Angular syntax\`,
  "styles": \`CSS styles\`
}

**Angular Template Examples:**

1. **Interpolation & Signals:**
\`\`\`html
<h1>{{ title }}</h1>
<p>Count: {{ count() }}</p>
\`\`\`

2. **Structural Directives (@if, @for):**
\`\`\`html
@if (isVisible) {
  <div>Content</div>
}

@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}
\`\`\`

3. **Event & Property Binding:**
\`\`\`html
<button (click)="handleClick()" [disabled]="isDisabled">Click</button>
\`\`\`

4. **Animations & Styles:**
\`\`\`html
<div class="animated fadeIn">Content</div>
\`\`\`

**Response Format:**

You must respond with a JSON object:
{
  "message": "Your friendly response",
  "action": {
    "type": "ACTION_TYPE",
    "payload": { /* action data */ }
  }
}

**Available Action Types:**

- CREATE_COMPONENT: { componentCode: ComponentCode }
- HIGHLIGHT_COMPONENTS: { selectors: string[], duration: number }
- LIST_COMPONENTS: null
- INSPECT_ELEMENT: { enabled: boolean }
- MODIFY_PROPERTY: { componentSelector: string, propertyPath: string, value: any }
- CHANGE_STYLE: { selector: string, styles: object }
- NONE: null

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**CREATE_COMPONENT Examples:**

User: "Create a Christmas story component"
Response: {
  "message": "I'll create a beautiful Christmas story component with animations!",
  "action": {
    "type": "CREATE_COMPONENT",
    "payload": {
      "componentCode": {
        "selector": "app-christmas-story",
        "name": "ChristmasStory",
        "template": \`
          <div class="story-container">
            <h1 class="story-title">The Magic of Christmas 🎄</h1>
            <div class="story-content">
              @for (chapter of chapters; track chapter.id) {
                <div class="chapter">
                  <h2>{{ chapter.title }}</h2>
                  <p>{{ chapter.content }}</p>
                </div>
              }
            </div>
            <div class="snowflakes">
              @for (flake of snowflakeCount; track flake) {
                <div class="snowflake">❄️</div>
              }
            </div>
          </div>
        \`,
        "styles": \`
          .story-container {
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            color: white;
            animation: fadeIn 1s ease;
          }
          .story-title {
            font-size: 3rem;
            text-align: center;
            margin-bottom: 40px;
            animation: glow 2s ease-in-out infinite;
          }
          .chapter {
            margin: 30px 0;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            animation: slideUp 0.6s ease;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes glow {
            0%, 100% { text-shadow: 0 0 20px rgba(255,255,255,0.5); }
            50% { text-shadow: 0 0 40px rgba(255,255,255,0.8); }
          }
        \`
      }
    }
  }
}

User: "Build a countdown timer"
Response: {
  "message": "Creating an interactive countdown timer component!",
  "action": {
    "type": "CREATE_COMPONENT",
    "payload": {
      "componentCode": {
        "selector": "app-countdown",
        "name": "Countdown",
        "template": \`
          <div class="timer">
            <h2>Christmas Countdown</h2>
            <div class="time-display">
              <div class="time-unit">
                <span class="number">{{ days }}</span>
                <span class="label">Days</span>
              </div>
              <div class="time-unit">
                <span class="number">{{ hours }}</span>
                <span class="label">Hours</span>
              </div>
              <div class="time-unit">
                <span class="number">{{ minutes }}</span>
                <span class="label">Minutes</span>
              </div>
              <div class="time-unit">
                <span class="number">{{ seconds }}</span>
                <span class="label">Seconds</span>
              </div>
            </div>
          </div>
        \`,
        "styles": \`
          .timer {
            text-align: center;
            padding: 40px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border-radius: 20px;
            color: white;
          }
          .time-display {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 30px;
          }
          .time-unit {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            background: rgba(255,255,255,0.2);
            border-radius: 12px;
            min-width: 100px;
          }
          .number {
            font-size: 3rem;
            font-weight: bold;
          }
          .label {
            font-size: 1rem;
            text-transform: uppercase;
            margin-top: 8px;
          }
        \`
      }
    }
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Guidelines:**

1. When creating components, use modern Angular syntax (@if, @for, signals)
2. Make components beautiful with gradients, animations, and modern design
3. Use semantic HTML and accessible markup
4. Include responsive design considerations
5. Add smooth animations (fadeIn, slideUp, pulse, etc.)
6. Use meaningful variable names in templates
7. Keep styles scoped and clean
8. Always provide a friendly explanation of what you're creating

Now respond to user queries with your FULL Angular expertise!`;
  }

  /**
   * Build full prompt with conversation history
   */
  private buildFullPrompt(message: string, history: ChatMessage[], systemPrompt: string): string {
    const historyText = history
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    return `${systemPrompt}

${historyText ? `**Conversation History:**\n${historyText}\n\n` : ''}**Current User Message:**
${message}

**Your Response (JSON format):**`;
  }

  /**
   * Call Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `${this.getApiUrl()}?key=${this.apiKey()}`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Parse Gemini response and extract action
   */
  private parseResponse(responseText: string): GeminiResponse {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          message: parsed.message || responseText,
          action: parsed.action || null
        };
      }

      // Fallback: treat entire response as message
      return {
        message: responseText,
        action: null
      };
    } catch (error) {
      console.warn('Failed to parse AI response as JSON, using raw text:', error);
      return {
        message: responseText,
        action: null
      };
    }
  }

  /**
   * Get suggested questions based on current context
   */
  getSuggestedQuestions(): string[] {
    const components = this.introspection.getAllComponents();
    const suggestions: string[] = [
      'What components are on this page?',
      'Explain how this page works',
      'Enable element inspector'
    ];

    if (components.some(c => c.signals && Object.keys(c.signals).length > 0)) {
      suggestions.push('Show me the signals being used');
    }

    if (components.length > 1) {
      suggestions.push(`Highlight the ${components[1].name} component`);
    }

    return suggestions;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return this.apiKey().length > 0;
  }
}
