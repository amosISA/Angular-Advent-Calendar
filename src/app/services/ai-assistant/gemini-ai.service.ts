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
  private readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  /**
   * Set API key for Gemini
   */
  setApiKey(key: string): void {
    this.apiKey.set(key);
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

    return `You are an AI assistant embedded in an Angular 20 application. You can understand and interact with the runtime code.

**Current Application Context:**

Route: ${context.currentRoute}
Viewport: ${context.viewport.width}x${context.viewport.height}

**Available Components:**
${components.map(c => `- ${c.selector} (${c.name})${Object.keys(c.signals || {}).length > 0 ? ' [has signals]' : ''}`).join('\n')}

**Your Capabilities:**

1. **List Components**: Show all components on the current page
2. **Highlight Components**: Visually highlight specific components
3. **Inspect Elements**: Enable element inspector mode (like Chrome DevTools)
4. **Analyze Components**: Explain component structure and signals
5. **Modify Properties**: Change component properties at runtime (signals and regular properties)
6. **Change Styles**: Modify CSS styles dynamically
7. **Explain Code**: Describe how components work

**Response Format:**

You must respond with a JSON object containing:
{
  "message": "Your natural language response to the user",
  "action": {
    "type": "ACTION_TYPE",
    "payload": { /* action-specific data */ }
  }
}

**Available Action Types:**

- HIGHLIGHT_COMPONENTS: { selectors: ["app-advent-calendar"], duration: 3000 }
- LIST_COMPONENTS: null
- INSPECT_ELEMENT: { enabled: true }
- MODIFY_PROPERTY: { componentSelector: "app-advent-calendar", propertyPath: "currentDay", value: 25 }
- CHANGE_STYLE: { selector: ".header", styles: { "color": "blue" } }
- EXPLAIN_CODE: null (just explanation in message)
- NONE: null (no action needed)

**Important Guidelines:**

1. Always provide friendly, helpful responses
2. Suggest actions when appropriate
3. If a component has signals, you can modify them using MODIFY_PROPERTY
4. Be specific about which component you're referring to
5. Explain technical concepts in simple terms
6. If unsure, use INSPECT_ELEMENT to let user show you what they mean

**Example Interactions:**

User: "What components are on this page?"
Response: {
  "message": "I found ${components.length} components on this page: ${components.map(c => c.name).join(', ')}. Would you like me to highlight any of them?",
  "action": { "type": "LIST_COMPONENTS", "payload": null }
}

User: "Highlight the advent calendar"
Response: {
  "message": "I'm highlighting the advent calendar component now. It will pulse with a blue border for 3 seconds.",
  "action": { "type": "HIGHLIGHT_COMPONENTS", "payload": { "selectors": ["app-advent-calendar"], "duration": 3000 } }
}

User: "Change the title to red"
Response: {
  "message": "I'll change the title color to red for you.",
  "action": { "type": "CHANGE_STYLE", "payload": { "selector": ".header h1", "styles": { "color": "red" } } }
}

Now respond to user queries based on the current application state.`;
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
    const url = `${this.API_URL}?key=${this.apiKey()}`;

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
