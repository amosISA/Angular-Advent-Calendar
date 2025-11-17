import { Component, inject, signal, effect, ElementRef, viewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiAIService } from '../../../services/ai-assistant/gemini-ai.service';
import { ClaudeAIService } from '../../../services/ai-assistant/claude-ai.service';
import { RuntimeModificationService } from '../../../services/ai-assistant/runtime-modification.service';
import { ComponentInspectorService } from '../../../services/ai-assistant/component-inspector.service';
import { ChatMessage, ElementInfo } from '../../../services/ai-assistant/models';

/**
 * AIAssistantChat Component
 * Main chat interface for the AI assistant
 */
@Component({
  selector: 'app-ai-assistant-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant-chat.component.html',
  styleUrls: ['./ai-assistant-chat.component.scss']
})
export class AIAssistantChatComponent {
  private readonly _geminiService = inject(GeminiAIService);
  private readonly _claudeService = inject(ClaudeAIService);
  private readonly _runtimeMod = inject(RuntimeModificationService);
  private readonly _inspector = inject(ComponentInspectorService);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _isBrowser = isPlatformBrowser(this._platformId);

  // Expose Object.keys to template
  protected readonly Object = Object;

  // Signals
  readonly isOpen = signal<boolean>(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly userInput = signal<string>('');
  readonly apiKey = signal<string>('');
  readonly isConfigured = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly selectedModel = signal<string>('claude-sonnet-4-5-20250929');
  readonly modelChangeNotification = signal<boolean>(false);
  readonly selectedComponents = signal<ElementInfo[]>([]);

  // Available AI models
  readonly availableModels = [
    {
      id: 'claude-sonnet-4-5-20250929',
      name: 'Claude Sonnet 4.5 (Most Powerful)',
      provider: 'Anthropic',
      keyUrl: 'https://console.anthropic.com/settings/keys',
      features: ['Most Advanced', 'Tool Use', 'Project Exploration', 'Smart Component Creation']
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      keyUrl: 'https://console.anthropic.com/settings/keys',
      features: ['Tool Use', 'Project Exploration', 'Smart Component Creation']
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      provider: 'Anthropic',
      keyUrl: 'https://console.anthropic.com/settings/keys',
      features: ['Fast', 'Tool Use']
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'Google',
      keyUrl: 'https://aistudio.google.com/app/apikey',
      features: ['Free', 'Fast']
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'Google',
      keyUrl: 'https://aistudio.google.com/app/apikey',
      features: ['Free']
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'Google',
      keyUrl: 'https://aistudio.google.com/app/apikey',
      features: ['Free']
    }
  ];

  // View children
  private messagesContainer = viewChild<ElementRef>('messagesContainer');

  // Suggested questions
  readonly suggestedQuestions = [
    'What components are on this page?',
    'Enable element inspector',
    'Highlight the advent calendar',
    'Explain how this app works'
  ];

  constructor() {
    // Load API key and model from localStorage (browser only)
    if (this._isBrowser) {
      const savedModel = localStorage.getItem('selected-model');

      if (savedModel) {
        this.selectedModel.set(savedModel);
      }

      const savedKey = localStorage.getItem('ai-api-key');
      if (savedKey) {
        this.apiKey.set(savedKey);
        this._configureAIService(savedKey, this.selectedModel());
        this.isConfigured.set(true);
      }
    }

    // Auto-scroll effect
    effect(() => {
      if (this.messages().length > 0) {
        setTimeout(() => this._scrollToBottom(), 100);
      }
    });

    // Watch for component selections from inspector
    effect(() => {
      const selected = this._inspector.selectedElement();
      if (selected && selected.component) {
        // Check if already in context before adding
        const exists = this.selectedComponents().find(
          c => c.component?.selector === selected.component?.selector
        );

        // Only add if not already present
        if (!exists) {
          this.addComponentToContext(selected);
        }
      }
    });

    // Watch for component context changes and scroll to bottom
    effect(() => {
      const components = this.selectedComponents();
      // Scroll whenever the list changes (add or remove)
      setTimeout(() => this._scrollToBottom(), 100);
    });

    // Add welcome message
    this.addMessage({
      id: this._generateId(),
      role: 'assistant',
      content: 'Hi! I\'m your AI assistant powered by Claude Sonnet 4.5 (the newest and most powerful model) and Gemini. I can explore your project, create components, and help you understand this Angular application. What would you like to know?',
      timestamp: Date.now()
    });
  }

  /**
   * Toggle chat panel
   */
  toggle(): void {
    this.isOpen.update(open => !open);
  }

  /**
   * Open chat panel
   */
  open(): void {
    this.isOpen.set(true);
  }

  /**
   * Close chat panel
   */
  close(): void {
    this.isOpen.set(false);
  }

  /**
   * Configure the appropriate AI service based on selected model
   */
  private _configureAIService(apiKey: string, modelId: string): void {
    const isClaude = modelId.startsWith('claude');
    if (isClaude) {
      this._claudeService.setApiKey(apiKey);
      this._claudeService.setModel(modelId);
    } else {
      this._geminiService.setApiKey(apiKey);
      this._geminiService.setModel(modelId);
    }
  }

  /**
   * Get the current AI service based on selected model
   */
  private _getCurrentAIService(): ClaudeAIService | GeminiAIService {
    return this.selectedModel().startsWith('claude')
      ? this._claudeService
      : this._geminiService;
  }

  /**
   * Save API key
   */
  saveApiKey(): void {
    if (!this._isBrowser) return;

    const key = this.apiKey().trim();
    if (key) {
      localStorage.setItem('ai-api-key', key);
      this._configureAIService(key, this.selectedModel());
      this.isConfigured.set(true);
      this.errorMessage.set('');
    }
  }

  /**
   * Clear API key
   */
  clearApiKey(): void {
    if (!this._isBrowser) return;

    localStorage.removeItem('ai-api-key');
    this.apiKey.set('');
    this._geminiService.setApiKey('');
    this._claudeService.setApiKey('');
    this.isConfigured.set(false);
  }

  /**
   * Send message to AI
   */
  async sendMessage(message?: string): Promise<void> {
    const text = message || this.userInput().trim();
    if (!text) return;

    if (!this.isConfigured()) {
      const provider = this.selectedModel().startsWith('claude') ? 'Claude' : 'Gemini';
      this.errorMessage.set(`Please configure your ${provider} API key first`);
      return;
    }

    // Build message with component context
    const componentContext = this._buildComponentContext();
    const fullMessage = text + componentContext;

    // Add user message (show original text only)
    this.addMessage({
      id: this._generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    });

    // Clear input
    this.userInput.set('');
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      // Get AI response from the appropriate service
      const aiService = this._getCurrentAIService();
      const response = await aiService.sendMessage(fullMessage, this.messages());

      // Add AI message
      this.addMessage({
        id: this._generateId(),
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
        action: response.action
      });

      // Execute action if present
      if (response.action) {
        await this._executeAction(response.action);
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to get AI response');
      this.addMessage({
        id: this._generateId(),
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${error.message}. Please check your API key and try again.`,
        timestamp: Date.now()
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Execute AI action
   */
  private async _executeAction(action: any): Promise<void> {
    try {
      // Add a status message based on action type
      let statusMessage = '';

      // Handle file-based component creation separately
      if (action.type === 'CREATE_FILE_COMPONENT') {
        statusMessage = '📝 Writing component files to disk...';
        this.addMessage({
          id: this._generateId(),
          role: 'assistant',
          content: statusMessage,
          timestamp: Date.now()
        });

        await this._createFileBasedComponent(action.payload);

        this.addMessage({
          id: this._generateId(),
          role: 'assistant',
          content: '✅ Component created successfully! The dev server is rebuilding... Your component will appear shortly.',
          timestamp: Date.now()
        });
        return;
      }

      switch (action.type) {
        case 'CREATE_COMPONENT':
          statusMessage = '✨ Component created and added to the page!';
          break;
        case 'HIGHLIGHT_COMPONENTS':
          statusMessage = '✓ Components highlighted';
          break;
        case 'INSPECT_ELEMENT':
          statusMessage = action.payload?.enabled ? '👁️ Inspector activated - click elements to inspect' : '✓ Inspector disabled';
          break;
        case 'MODIFY_PROPERTY':
          statusMessage = '✓ Property updated';
          break;
        case 'CHANGE_STYLE':
          statusMessage = '✓ Styles applied';
          break;
      }

      const result = await this._runtimeMod.executeAction(action);
      console.log('Action executed:', result);

      // Add status message to chat if relevant
      if (statusMessage && action.type !== 'NONE') {
        this.addMessage({
          id: this._generateId(),
          role: 'assistant',
          content: statusMessage,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error executing action:', error);
      this.addMessage({
        id: this._generateId(),
        role: 'assistant',
        content: `⚠️ Action failed: ${error}`,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Create file-based component by calling dev server API
   */
  private async _createFileBasedComponent(payload: any): Promise<void> {
    const DEV_SERVER_URL = 'http://localhost:4201';

    try {
      console.log('[FileBasedComponent] Creating component:', payload.componentName);

      const response = await fetch(`${DEV_SERVER_URL}/api/component/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          componentName: payload.componentName,
          componentPath: payload.componentPath,
          files: payload.files,
          insertInto: payload.insertInto
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create component files');
      }

      console.log('[FileBasedComponent] ✅ Component created successfully:', result);

    } catch (error: any) {
      console.error('[FileBasedComponent] ❌ Error:', error);
      throw new Error(`Failed to create component: ${error.message}`);
    }
  }

  /**
   * Add message to chat
   */
  private addMessage(message: ChatMessage): void {
    this.messages.update(msgs => [...msgs, message]);
  }

  /**
   * Scroll to bottom of messages
   */
  private _scrollToBottom(): void {
    const container = this.messagesContainer();
    if (container) {
      const element = container.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  /**
   * Generate unique message ID
   */
  private _generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle enter key in input
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Clear chat history
   */
  clearChat(): void {
    this.messages.set([{
      id: this._generateId(),
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      timestamp: Date.now()
    }]);
  }

  /**
   * Get inspector state
   */
  get inspectorActive(): boolean {
    return this._inspector.inspecting();
  }

  /**
   * Toggle inspector mode
   */
  toggleInspector(): void {
    this._inspector.toggleInspection();
  }

  /**
   * Handle model change
   */
  onModelChange(): void {
    if (!this._isBrowser) return;

    const modelId = this.selectedModel();
    localStorage.setItem('selected-model', modelId);

    if (this.isConfigured()) {
      const apiKey = this.apiKey();
      this._configureAIService(apiKey, modelId);

      // Show notification
      this.modelChangeNotification.set(true);
      setTimeout(() => {
        this.modelChangeNotification.set(false);
      }, 3000);
    }
  }

  /**
   * Get API key placeholder based on selected model
   */
  getApiKeyPlaceholder(): string {
    const model = this.availableModels.find(m => m.id === this.selectedModel());
    return model ? `Enter ${model.provider} API key...` : 'Enter API key...';
  }

  /**
   * Get API key URL based on selected model
   */
  getApiKeyUrl(): string {
    const model = this.availableModels.find(m => m.id === this.selectedModel());
    return model?.keyUrl || 'https://aistudio.google.com/app/apikey';
  }

  /**
   * Get selected model name
   */
  getSelectedModelName(): string {
    const model = this.availableModels.find(m => m.id === this.selectedModel());
    return model?.name || this.selectedModel();
  }

  /**
   * Get user-friendly action label
   */
  protected getActionLabel(actionType: string): string {
    const labels: Record<string, string> = {
      'CREATE_COMPONENT': 'Component Creation',
      'CREATE_FILE_COMPONENT': 'File-Based Component',
      'HIGHLIGHT_COMPONENTS': 'Highlight',
      'INSPECT_ELEMENT': 'Inspector',
      'MODIFY_PROPERTY': 'Property Change',
      'CHANGE_STYLE': 'Style Update',
      'LIST_COMPONENTS': 'Component List'
    };
    return labels[actionType] || actionType;
  }

  /**
   * Add component to context
   */
  addComponentToContext(elementInfo: ElementInfo): void {
    if (!elementInfo.component) return;

    // Add to components list
    this.selectedComponents.update(components => [...components, elementInfo]);

    // Add notification message
    this.addMessage({
      id: this._generateId(),
      role: 'assistant',
      content: `✨ Added <${elementInfo.component.selector}> to context. You can now ask me questions about this component!`,
      timestamp: Date.now()
    });
  }

  /**
   * Remove component from context
   */
  removeComponentFromContext(index: number): void {
    // Clear the inspector selection to prevent re-adding
    this._inspector.clearSelection();

    // Remove from list
    this.selectedComponents.update(components =>
      components.filter((_, i) => i !== index)
    );
  }

  /**
   * Clear all component context
   */
  clearComponentContext(): void {
    // Clear the inspector selection to prevent re-adding
    this._inspector.clearSelection();

    // Clear all components
    this.selectedComponents.set([]);
  }

  /**
   * Build component context string for AI
   */
  private _buildComponentContext(): string {
    const components = this.selectedComponents();
    if (components.length === 0) return '';

    let context = '\n\n**Selected Components Context:**\n\n';

    components.forEach((comp, index) => {
      if (!comp.component) return;

      context += `${index + 1}. Component: ${comp.component.name}\n`;
      context += `   Selector: <${comp.component.selector}>\n`;

      // Add signals/state
      const signals = comp.component.signals || {};
      if (Object.keys(signals).length > 0) {
        context += `   State:\n`;
        Object.entries(signals).forEach(([name, value]) => {
          context += `     - ${name}: ${JSON.stringify(value)}\n`;
        });
      }

      context += '\n';
    });

    return context;
  }
}
