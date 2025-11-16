import { Component, inject, signal, effect, ElementRef, viewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiAIService } from '../../../services/ai-assistant/gemini-ai.service';
import { RuntimeModificationService } from '../../../services/ai-assistant/runtime-modification.service';
import { ComponentInspectorService } from '../../../services/ai-assistant/component-inspector.service';
import { ChatMessage } from '../../../services/ai-assistant/models';

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
  private geminiService = inject(GeminiAIService);
  private runtimeMod = inject(RuntimeModificationService);
  private inspector = inject(ComponentInspectorService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Signals
  readonly isOpen = signal<boolean>(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly userInput = signal<string>('');
  readonly apiKey = signal<string>('');
  readonly isConfigured = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly selectedModel = signal<string>('gemini-2.5-flash');
  readonly modelChangeNotification = signal<boolean>(false);

  // Available AI models
  readonly availableModels = [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'Google',
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      keyUrl: 'https://aistudio.google.com/app/apikey',
      free: true
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'Google',
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      keyUrl: 'https://aistudio.google.com/app/apikey',
      free: true
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'Google',
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
      keyUrl: 'https://aistudio.google.com/app/apikey',
      free: true
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
    if (this.isBrowser) {
      const savedKey = localStorage.getItem('gemini-api-key');
      const savedModel = localStorage.getItem('selected-model');

      if (savedModel) {
        this.selectedModel.set(savedModel);
      }

      if (savedKey) {
        this.apiKey.set(savedKey);
        this.geminiService.setApiKey(savedKey);
        this.geminiService.setModel(this.selectedModel());
        this.isConfigured.set(true);
      }
    }

    // Auto-scroll effect
    effect(() => {
      if (this.messages().length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });

    // Add welcome message
    this.addMessage({
      id: this.generateId(),
      role: 'assistant',
      content: 'Hi! I\'m your AI assistant. I can help you understand and interact with this Angular application. What would you like to know?',
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
   * Save API key
   */
  saveApiKey(): void {
    if (!this.isBrowser) return;

    const key = this.apiKey().trim();
    if (key) {
      localStorage.setItem('gemini-api-key', key);
      this.geminiService.setApiKey(key);
      this.isConfigured.set(true);
      this.errorMessage.set('');
    }
  }

  /**
   * Clear API key
   */
  clearApiKey(): void {
    if (!this.isBrowser) return;

    localStorage.removeItem('gemini-api-key');
    this.apiKey.set('');
    this.geminiService.setApiKey('');
    this.isConfigured.set(false);
  }

  /**
   * Send message to AI
   */
  async sendMessage(message?: string): Promise<void> {
    const text = message || this.userInput().trim();
    if (!text) return;

    if (!this.isConfigured()) {
      this.errorMessage.set('Please configure your Gemini API key first');
      return;
    }

    // Add user message
    this.addMessage({
      id: this.generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    });

    // Clear input
    this.userInput.set('');
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      // Get AI response
      const response = await this.geminiService.sendMessage(text, this.messages());

      // Add AI message
      this.addMessage({
        id: this.generateId(),
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
        action: response.action
      });

      // Execute action if present
      if (response.action) {
        await this.executeAction(response.action);
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to get AI response');
      this.addMessage({
        id: this.generateId(),
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
  private async executeAction(action: any): Promise<void> {
    try {
      // Add a status message based on action type
      let statusMessage = '';
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

      const result = await this.runtimeMod.executeAction(action);
      console.log('Action executed:', result);

      // Add status message to chat if relevant
      if (statusMessage && action.type !== 'NONE') {
        this.addMessage({
          id: this.generateId(),
          role: 'assistant',
          content: statusMessage,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error executing action:', error);
      this.addMessage({
        id: this.generateId(),
        role: 'assistant',
        content: `⚠️ Action failed: ${error}`,
        timestamp: Date.now()
      });
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
  private scrollToBottom(): void {
    const container = this.messagesContainer();
    if (container) {
      const element = container.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
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
      id: this.generateId(),
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      timestamp: Date.now()
    }]);
  }

  /**
   * Get inspector state
   */
  get inspectorActive(): boolean {
    return this.inspector.inspecting();
  }

  /**
   * Toggle inspector mode
   */
  toggleInspector(): void {
    this.inspector.toggleInspection();
  }

  /**
   * Handle model change
   */
  onModelChange(): void {
    if (!this.isBrowser) return;

    const modelId = this.selectedModel();
    localStorage.setItem('selected-model', modelId);

    if (this.isConfigured()) {
      this.geminiService.setModel(modelId);

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
      'HIGHLIGHT_COMPONENTS': 'Highlight',
      'INSPECT_ELEMENT': 'Inspector',
      'MODIFY_PROPERTY': 'Property Change',
      'CHANGE_STYLE': 'Style Update',
      'LIST_COMPONENTS': 'Component List'
    };
    return labels[actionType] || actionType;
  }
}
