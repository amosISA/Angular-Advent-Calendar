import { Component, output } from '@angular/core';

/**
 * FloatingActionButton Component
 * Displays a floating button at the bottom-right corner
 * Triggers the AI assistant chat when clicked
 */
@Component({
  selector: 'app-floating-action-button',
  standalone: true,
  template: `
    <button
      class="fab"
      (click)="fabClick.emit()"
      aria-label="Open AI Assistant"
      title="Open AI Assistant"
    >
      <svg class="gemini-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.9"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="pulse-ring"></span>
    </button>
  `,
  styles: [`
    .fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4285f4, #34a853);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(66, 133, 244, 0.4);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 999990;
      overflow: visible;
    }

    .fab:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 30px rgba(66, 133, 244, 0.6);
    }

    .fab:active {
      transform: scale(0.95);
    }

    .gemini-icon {
      width: 32px;
      height: 32px;
      color: white;
      transition: transform 0.3s ease;
    }

    .fab:hover .gemini-icon {
      transform: rotate(10deg);
    }

    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 3px solid #4285f4;
      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      opacity: 0;
    }

    @keyframes pulse-ring {
      0% {
        transform: scale(1);
        opacity: 0.5;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }

    @media (max-width: 768px) {
      .fab {
        width: 56px;
        height: 56px;
        bottom: 16px;
        right: 16px;
      }

      .gemini-icon {
        width: 28px;
        height: 28px;
      }
    }
  `]
})
export class FloatingActionButtonComponent {
  fabClick = output<void>();
}
