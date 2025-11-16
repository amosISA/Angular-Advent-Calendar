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

      console.log('Sending to Gemini:', {
        model: this.selectedModel(),
        messageLength: fullPrompt.length,
        historyLength: conversationHistory.length
      });

      const response = await this.callGeminiAPI(fullPrompt);
      const parsedResponse = this.parseResponse(response);

      console.log('Gemini response:', parsedResponse);

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

1. **CREATE COMPONENTS**: Generate complete Angular components and place them on the page
   - Understand where to place components based on user intent
   - "create a navbar" → position: "top"
   - "add a footer" → position: "bottom"
   - "create before the calendar" → position: "before-calendar"
   - "add below the calendar" → position: "after-calendar"
2. **List Components**: Show all components on the current page
3. **Highlight Components**: Visually highlight specific components
4. **Inspect Elements**: Enable element inspector mode
5. **Modify Properties**: Change component properties at runtime
6. **Change Styles**: Modify CSS styles dynamically

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**CREATING COMPONENTS AT RUNTIME:**

When user asks you to create a component, you generate COMPLETE Angular component code including:
1. **Template**: HTML with Angular syntax (@if, @for, interpolation, event binding)
2. **Styles**: CSS/SCSS for the component
3. **TypeScript Logic**: Component class with properties, methods, and signals

**Component Structure:**
{
  "selector": "app-component-name",
  "name": "ComponentName",
  "template": "HTML template as string with \\n for newlines",
  "styles": "CSS as string",
  "typescript": "const componentLogic = { /* properties and methods */ };"
}

**TypeScript Logic Format:**
The typescript field contains executable code that creates a componentLogic object:

const componentLogic = {
  // Signals (reactive state)
  isDarkMode: signal(false),
  count: signal(0),

  // Regular properties
  title: 'My Component',
  items: ['item1', 'item2'],

  // Methods
  handleClick() {
    console.log('Clicked!');
  },

  toggleTheme() {
    this.isDarkMode.update(v => !v);
  },

  increment() {
    this.count.update(v => v + 1);
  }
};

IMPORTANT:
- Use signal(initialValue) for reactive state
- Methods can access other properties via 'this'
- Signals are updated with .update() or .set()
- Template can use signals with {{ mySignal() }}

**Angular Template Examples:**

1. Interpolation & Signals:
   <h1>{{ title }}</h1>
   <p>Count: {{ count() }}</p>

2. Structural Directives (@if, @for):
   @if (isVisible) { <div>Content</div> }
   @for (item of items; track item.id) { <div>{{ item.name }}</div> }

3. Event & Property Binding:
   <button (click)="handleClick()" [disabled]="isDisabled">Click</button>

4. Animations & Styles:
   <div class="animated fadeIn">Content</div>

**Response Format:**

You MUST respond with a VALID JSON object. IMPORTANT: Use REGULAR STRINGS (double quotes), NOT template literals (backticks):

{
  "message": "Your friendly response",
  "action": {
    "type": "ACTION_TYPE",
    "payload": { /* action data */ }
  }
}

CRITICAL: When including HTML templates or CSS in your JSON:
- Use regular JSON strings with "double quotes"
- Escape newlines as \\n
- DO NOT use backticks or template literals
- Example: "template": "<div>\\n  <h1>Title</h1>\\n</div>"

**Available Action Types:**

- CREATE_COMPONENT: { componentCode: ComponentCode }
- HIGHLIGHT_COMPONENTS: { selectors: string[], duration: number }
- LIST_COMPONENTS: null
- INSPECT_ELEMENT: { enabled: boolean }
- MODIFY_PROPERTY: { componentSelector: string, propertyPath: string, value: any }
- CHANGE_STYLE: { selector: string, styles: object }
- NONE: null

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**CREATE_COMPONENT Example:**

User: "Create a navbar with dark mode toggle at the top"
Response (pure JSON, NO markdown):
{
  "message": "Creating a navbar with dark mode toggle!",
  "action": {
    "type": "CREATE_COMPONENT",
    "payload": {
      "componentCode": {
        "selector": "app-theme-navbar",
        "name": "ThemeNavbar",
        "template": "<nav class=\\"navbar\\" [class.dark]=\"isDarkMode()\\">\\n  <div class=\\"brand\\">My App</div>\\n  <button class=\\"theme-btn\\" (click)=\"toggleTheme()\\">\\n    {{ isDarkMode() ? '☀️ Light' : '🌙 Dark' }}\\n  </button>\\n</nav>",
        "styles": ".navbar { display: flex; justify-content: space-between; padding: 20px; background: linear-gradient(90deg, #6a11cb, #2575fc); color: white; transition: 0.3s; } .navbar.dark { background: linear-gradient(90deg, #2c3e50, #34495e); } .theme-btn { background: rgba(255,255,255,0.2); border: none; padding: 10px 20px; border-radius: 20px; color: white; cursor: pointer; } .theme-btn:hover { background: rgba(255,255,255,0.3); }",
        "typescript": "const componentLogic = { isDarkMode: signal(false), toggleTheme() { this.isDarkMode.update(v => !v); } };"
      },
      "position": "top"
    }
  }
}

User: "Create a counter button"
Response:
{
  "message": "Creating an interactive counter!",
  "action": {
    "type": "CREATE_COMPONENT",
    "payload": {
      "componentCode": {
        "selector": "app-counter",
        "name": "CounterComponent",
        "template": "<div class=\\"counter\\">\\n  <button (click)=\"decrement()\\">-</button>\\n  <span class=\\"count\\">{{ count() }}</span>\\n  <button (click)=\"increment()\\">+</button>\\n  <button (click)=\"reset()\\">Reset</button>\\n</div>",
        "styles": ".counter { display: flex; gap: 10px; align-items: center; padding: 20px; } .count { font-size: 2rem; font-weight: bold; min-width: 50px; text-align: center; } button { padding: 10px 20px; font-size: 1rem; cursor: pointer; border: none; background: #3498db; color: white; border-radius: 5px; } button:hover { background: #2980b9; }",
        "typescript": "const componentLogic = { count: signal(0), increment() { this.count.update(v => v + 1); }, decrement() { this.count.update(v => v - 1); }, reset() { this.count.set(0); } };"
      },
      "position": "bottom"
    }
  }
}

Position values: "top", "bottom", "before-calendar", "after-calendar"

CRITICAL:
- Include ALL three fields: template, styles, AND typescript
- Use proper JSON with escaped quotes (\\") and newlines (\\n)
- NO backticks, NO template literals, NO markdown blocks
- TypeScript must define componentLogic object with signals and methods

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
    // Limit conversation history to last 10 messages to prevent token overflow
    const recentHistory = history
      .filter(msg => msg.role !== 'system')
      .slice(-10);

    const historyText = recentHistory
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
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH"
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

    console.log('Full Gemini API response:', JSON.stringify(data, null, 2));

    // Check for blocked content or safety issues
    if (!data.candidates || data.candidates.length === 0) {
      console.error('Gemini API response:', data);

      // Check for specific error in promptFeedback
      if (data.promptFeedback) {
        console.error('Prompt feedback:', data.promptFeedback);
        if (data.promptFeedback.blockReason) {
          throw new Error(`Content blocked: ${data.promptFeedback.blockReason}. Try a simpler request.`);
        }
      }

      throw new Error('No response from Gemini API. The content might have been blocked by safety filters.');
    }

    const candidate = data.candidates[0];
    console.log('Candidate:', JSON.stringify(candidate, null, 2));

    // Check if content was blocked
    if (candidate.finishReason === 'SAFETY') {
      console.error('Content blocked by safety filters:', candidate);
      throw new Error('Response blocked by safety filters. Try a simpler request.');
    }

    // Check for MAX_TOKENS finish reason
    if (candidate.finishReason === 'MAX_TOKENS') {
      console.error('Response truncated due to MAX_TOKENS limit');
      // Still try to use partial content if available
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0 && candidate.content.parts[0].text) {
        console.warn('Using partial response from MAX_TOKENS');
      } else {
        throw new Error('Response was truncated (MAX_TOKENS). Please try a simpler request or reduce conversation history.');
      }
    }

    // Check for other finish reasons
    if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
      console.warn('Unusual finish reason:', candidate.finishReason);
    }

    // Check if content exists
    if (!candidate.content) {
      console.error('No content in candidate:', candidate);
      throw new Error('No content in response. Try rephrasing your request.');
    }

    // Check if content and parts exist
    if (!candidate.content.parts || candidate.content.parts.length === 0) {
      console.error('No content parts in response:', candidate);
      throw new Error('Invalid response format from Gemini API. The response had no text content.');
    }

    // Check if text exists in first part
    if (!candidate.content.parts[0].text) {
      console.error('No text in first part:', candidate.content.parts[0]);
      throw new Error('Response contained no text. Try a different request.');
    }

    const text = candidate.content.parts[0].text;
    console.log('Extracted text:', text.substring(0, 200) + '...');

    return text;
  }

  /**
   * Parse Gemini response and extract action
   */
  private parseResponse(responseText: string): GeminiResponse {
    try {
      // Remove markdown code blocks if present
      let cleanedText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Convert template literals to regular strings for JSON parsing
      // Match backtick template literals and convert to regular JSON strings
      cleanedText = cleanedText.replace(/:\s*`([^`]*)`/g, (match, content) => {
        // Escape quotes and newlines in the content
        const escaped = content
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `: "${escaped}"`;
      });

      // Try to extract JSON from response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);

          // Validate the response has required fields
          if (parsed.message) {
            return {
              message: parsed.message,
              action: parsed.action || null
            };
          }
        } catch (parseError) {
          console.warn('JSON parse error:', parseError);
          console.warn('Cleaned text:', cleanedText.substring(0, 500));
        }
      }

      // Fallback: treat entire response as message
      console.warn('Could not parse JSON response, using raw text');
      return {
        message: responseText,
        action: null
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        message: responseText || 'Error parsing response',
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
