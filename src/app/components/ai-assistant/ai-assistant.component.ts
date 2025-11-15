import { Component, viewChild } from '@angular/core';
import { FloatingActionButtonComponent } from './floating-action-button/floating-action-button.component';
import { AIAssistantChatComponent } from './ai-assistant-chat/ai-assistant-chat.component';

/**
 * AIAssistant Component
 * Main wrapper that combines FAB and chat interface
 */
@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [FloatingActionButtonComponent, AIAssistantChatComponent],
  template: `
    <app-floating-action-button
      (fabClick)="toggleChat()"
    />
    <app-ai-assistant-chat #chat />
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class AIAssistantComponent {
  private chat = viewChild<AIAssistantChatComponent>('chat');

  toggleChat(): void {
    this.chat()?.toggle();
  }
}
