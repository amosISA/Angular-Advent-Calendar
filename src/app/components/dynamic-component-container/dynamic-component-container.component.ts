import { Component, ViewChild, ViewContainerRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * DynamicComponentContainerComponent
 * Container for AI-generated components at runtime
 */
@Component({
  selector: 'app-dynamic-component-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dynamic-container">
      @if (isEmpty()) {
        <div class="empty-state">
          <div class="empty-icon">🤖</div>
          <h2>No AI-Generated Component Yet</h2>
          <p>Ask the AI to create a component for you!</p>
          <div class="suggestions">
            <p>Try asking:</p>
            <ul>
              <li>"Create a Christmas story component with animations"</li>
              <li>"Generate a countdown timer component"</li>
              <li>"Build an interactive quiz component"</li>
              <li>"Create a photo gallery component"</li>
            </ul>
          </div>
        </div>
      }

      <!-- Dynamic component will be inserted here -->
      <div #dynamicContainer></div>
    </div>
  `,
  styles: [`
    .dynamic-container {
      width: 100%;
      min-height: 400px;
      animation: fadeIn 0.6s ease;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      max-width: 600px;
      margin: 0 auto;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 20px;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .empty-state h2 {
      color: #fff;
      font-size: 2rem;
      margin: 0 0 16px 0;
      font-weight: 700;
    }

    .empty-state > p {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.125rem;
      margin: 0 0 32px 0;
    }

    .suggestions {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      text-align: left;
    }

    .suggestions p {
      color: rgba(255, 255, 255, 0.9);
      font-weight: 600;
      margin: 0 0 12px 0;
      font-size: 1rem;
    }

    .suggestions ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .suggestions li {
      color: rgba(255, 255, 255, 0.8);
      padding: 10px 16px;
      margin-bottom: 8px;
      background: rgba(102, 126, 234, 0.2);
      border-radius: 8px;
      border-left: 3px solid #667eea;
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }

    .suggestions li:hover {
      background: rgba(102, 126, 234, 0.3);
      transform: translateX(4px);
    }

    #dynamicContainer {
      width: 100%;
    }
  `]
})
export class DynamicComponentContainerComponent {
  @ViewChild('dynamicContainer', { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;

  readonly isEmpty = signal<boolean>(true);

  setNotEmpty(): void {
    this.isEmpty.set(false);
  }

  setEmpty(): void {
    this.isEmpty.set(true);
  }

  getContainer(): ViewContainerRef {
    return this.container;
  }
}
