import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Tab Navigation Component
 * Provides tab switching between Advent Calendar and Christmas Story
 */
@Component({
  selector: 'app-tab-navigation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tab-navigation">
      <div class="tab-container">
        <button
          class="tab-button"
          [class.active]="activeTab() === 'calendar'"
          (click)="setActiveTab('calendar')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Advent Calendar
        </button>
        <button
          class="tab-button"
          [class.active]="activeTab() === 'story'"
          (click)="setActiveTab('story')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          Christmas Story
        </button>
      </div>
      <div class="tab-indicator" [style.transform]="getIndicatorTransform()"></div>
    </div>
  `,
  styles: [`
    .tab-navigation {
      position: relative;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 6px;
      margin-bottom: 32px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .tab-container {
      display: flex;
      gap: 8px;
      position: relative;
      z-index: 1;
    }

    .tab-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px 24px;
      background: transparent;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }

    .tab-button svg {
      width: 20px;
      height: 20px;
      transition: all 0.3s ease;
    }

    .tab-button:hover:not(.active) {
      color: rgba(255, 255, 255, 0.9);
      transform: translateY(-2px);
    }

    .tab-button.active {
      color: #fff;
    }

    .tab-button.active svg {
      stroke: #ffd700;
    }

    .tab-indicator {
      position: absolute;
      top: 6px;
      left: 6px;
      width: calc(50% - 10px);
      height: calc(100% - 12px);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
    }

    @media (max-width: 640px) {
      .tab-button {
        font-size: 14px;
        padding: 12px 16px;
      }

      .tab-button svg {
        width: 18px;
        height: 18px;
      }
    }
  `]
})
export class TabNavigationComponent {
  readonly activeTab = signal<'calendar' | 'story'>('calendar');

  setActiveTab(tab: 'calendar' | 'story'): void {
    this.activeTab.set(tab);
  }

  getIndicatorTransform(): string {
    return this.activeTab() === 'calendar' ? 'translateX(0)' : 'translateX(calc(100% + 14px))';
  }
}
