import { Injectable, inject, signal } from '@angular/core';
import { AngularIntrospectionService } from './angular-introspection.service';
import { ElementInfo } from './models';

/**
 * ComponentInspectorService
 * Provides Chrome DevTools-like element inspection
 * Allows users to hover and click elements to inspect them
 */
@Injectable({
  providedIn: 'root'
})
export class ComponentInspectorService {
  private introspection = inject(AngularIntrospectionService);

  // Signals for reactive state
  readonly inspecting = signal<boolean>(false);
  readonly hoveredElement = signal<ElementInfo | null>(null);
  readonly selectedElement = signal<ElementInfo | null>(null);
  readonly highlightedSelectors = signal<string[]>([]);

  // Private state
  private overlayElement: HTMLElement | null = null;
  private highlightElements: Map<string, HTMLElement> = new Map();

  /**
   * Start element inspection mode
   */
  startInspection(): void {
    if (this.inspecting()) return;

    this.inspecting.set(true);
    this.createOverlay();
    this.attachEventListeners();
  }

  /**
   * Stop element inspection mode
   */
  stopInspection(): void {
    if (!this.inspecting()) return;

    this.inspecting.set(false);
    this.removeOverlay();
    this.detachEventListeners();
    this.hoveredElement.set(null);
  }

  /**
   * Toggle inspection mode
   */
  toggleInspection(): void {
    if (this.inspecting()) {
      this.stopInspection();
    } else {
      this.startInspection();
    }
  }

  /**
   * Highlight components by selectors
   */
  highlightComponents(selectors: string[], duration: number = 0): void {
    this.clearHighlights();

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element, index) => {
        this.createHighlight(element as HTMLElement, selector, index);
      });
    });

    this.highlightedSelectors.set(selectors);

    // Auto-clear after duration (if duration > 0)
    if (duration > 0) {
      setTimeout(() => {
        this.clearHighlights();
      }, duration);
    }
  }

  /**
   * Clear all highlights
   */
  clearHighlights(): void {
    this.highlightElements.forEach(element => {
      // Call cleanup function if it exists
      if ((element as any)._cleanup) {
        (element as any)._cleanup();
      }
      element.remove();
    });
    this.highlightElements.clear();
    this.highlightedSelectors.set([]);
  }

  /**
   * Create highlight overlay for element
   */
  private createHighlight(element: HTMLElement, selector: string, index: number): void {
    const rect = element.getBoundingClientRect();
    const highlight = document.createElement('div');
    const key = `${selector}-${index}`;

    // Store update function for cleanup
    const updatePosition = () => {
      const newRect = element.getBoundingClientRect();
      highlight.style.top = `${newRect.top}px`;
      highlight.style.left = `${newRect.left}px`;
      highlight.style.width = `${newRect.width}px`;
      highlight.style.height = `${newRect.height}px`;
    };

    highlight.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 3px solid #4285f4;
      background: rgba(66, 133, 244, 0.1);
      pointer-events: none;
      z-index: 999998;
      box-shadow: 0 0 20px rgba(66, 133, 244, 0.6);
      animation: pulseHighlight 1.5s ease-in-out infinite;
      border-radius: 4px;
      transition: all 0.2s ease;
    `;

    // Add label with component info
    const label = document.createElement('div');
    const elementInfo = this.introspection.getElementInfo(element);
    const componentName = elementInfo.component?.name || selector;

    label.textContent = componentName;
    label.style.cssText = `
      position: absolute;
      top: -32px;
      left: 0;
      background: #4285f4;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', monospace;
      white-space: nowrap;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
      font-weight: 500;
    `;
    highlight.appendChild(label);

    document.body.appendChild(highlight);
    this.highlightElements.set(key, highlight);

    // Update position on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    // Store the cleanup function
    (highlight as any)._cleanup = () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }

  /**
   * Create inspection overlay
   */
  private createOverlay(): void {
    this.overlayElement = document.createElement('div');
    this.overlayElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.01);
      z-index: 999999;
      cursor: crosshair;
    `;

    // Add instruction tooltip
    const tooltip = document.createElement('div');
    tooltip.textContent = 'Click to select element • ESC to cancel';
    tooltip.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000000;
      pointer-events: none;
    `;
    this.overlayElement.appendChild(tooltip);

    document.body.appendChild(this.overlayElement);
  }

  /**
   * Remove inspection overlay
   */
  private removeOverlay(): void {
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }
  }

  /**
   * Handle mouse move over elements
   */
  private onMouseMove = (event: MouseEvent): void => {
    if (!this.inspecting()) return;

    const target = this.getTargetElement(event);
    if (!target) return;

    const elementInfo = this.introspection.getElementInfo(target);
    this.hoveredElement.set(elementInfo);

    this.updateHoverHighlight(target);
  };

  /**
   * Handle element click
   */
  private onClick = (event: MouseEvent): void => {
    if (!this.inspecting()) return;

    event.preventDefault();
    event.stopPropagation();

    const target = this.getTargetElement(event);
    if (!target) return;

    const elementInfo = this.introspection.getElementInfo(target);
    this.selectedElement.set(elementInfo);

    // Show component details modal
    this.showComponentDetails(elementInfo);

    // Stop inspection after selection
    this.stopInspection();
  };

  /**
   * Handle keyboard events
   */
  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.inspecting()) {
      this.stopInspection();
    }
  };

  /**
   * Get actual target element (excluding overlay)
   */
  private getTargetElement(event: MouseEvent): HTMLElement | null {
    // Temporarily hide overlay to get element underneath
    if (this.overlayElement) {
      this.overlayElement.style.pointerEvents = 'none';
    }

    const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;

    if (this.overlayElement) {
      this.overlayElement.style.pointerEvents = 'auto';
    }

    return element;
  }

  /**
   * Update hover highlight
   */
  private updateHoverHighlight(element: HTMLElement): void {
    // Remove existing hover highlight
    const existingHover = document.getElementById('inspector-hover-highlight');
    if (existingHover) {
      existingHover.remove();
    }

    const rect = element.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.id = 'inspector-hover-highlight';

    const isComponent = this.introspection.isAngularComponent(element);
    const borderColor = isComponent ? '#34a853' : '#fbbc04';

    highlight.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 3px solid ${borderColor};
      background: ${isComponent ? 'rgba(52, 168, 83, 0.15)' : 'rgba(251, 188, 4, 0.15)'};
      pointer-events: none;
      z-index: 999997;
      border-radius: 4px;
      box-shadow: 0 0 15px ${isComponent ? 'rgba(52, 168, 83, 0.4)' : 'rgba(251, 188, 4, 0.4)'};
      transition: all 0.15s ease;
    `;

    // Add info tooltip with component details
    const tooltip = document.createElement('div');
    const componentInfo = this.hoveredElement();

    let tooltipHTML = '';
    if (componentInfo?.component) {
      const componentName = componentInfo.component.name;
      const selector = componentInfo.component.selector;
      const signalCount = Object.keys(componentInfo.component.signals || {}).length;

      tooltipHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">${componentName}</div>
        <div style="opacity: 0.9; font-size: 11px;">&lt;${selector}&gt;</div>
        ${signalCount > 0 ? `<div style="margin-top: 4px; font-size: 11px; opacity: 0.8;">📊 ${signalCount} signal${signalCount > 1 ? 's' : ''}</div>` : ''}
      `;
    } else {
      tooltipHTML = `<div>${element.tagName.toLowerCase()}</div>`;
    }

    tooltip.innerHTML = tooltipHTML;
    tooltip.style.cssText = `
      position: absolute;
      bottom: -85px;
      left: 0;
      background: ${borderColor};
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', monospace;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 300px;
      line-height: 1.4;
    `;
    highlight.appendChild(tooltip);

    document.body.appendChild(highlight);
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    document.addEventListener('mousemove', this.onMouseMove, true);
    document.addEventListener('click', this.onClick, true);
    document.addEventListener('keydown', this.onKeyDown, true);
  }

  /**
   * Detach event listeners
   */
  private detachEventListeners(): void {
    document.removeEventListener('mousemove', this.onMouseMove, true);
    document.removeEventListener('click', this.onClick, true);
    document.removeEventListener('keydown', this.onKeyDown, true);

    // Remove hover highlight
    const existingHover = document.getElementById('inspector-hover-highlight');
    if (existingHover) {
      existingHover.remove();
    }
  }

  /**
   * Show component details modal
   */
  private showComponentDetails(elementInfo: ElementInfo): void {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'component-details-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      z-index: 1000000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    `;

    // Create modal content
    const content = document.createElement('div');
    content.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0;
      border-radius: 16px;
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.3s ease;
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', monospace;
    `;

    let detailsHTML = `
      <div style="padding: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
        <h2 style="margin: 0; font-size: 24px; font-weight: 700;">Component Inspector</h2>
      </div>
      <div style="padding: 24px; max-height: calc(80vh - 150px); overflow-y: auto; background: rgba(255, 255, 255, 0.1);">
    `;

    if (elementInfo.component) {
      detailsHTML += `
        <div style="margin-bottom: 20px;">
          <div style="font-size: 12px; opacity: 0.7; text-transform: uppercase; margin-bottom: 8px;">Component</div>
          <div style="font-size: 18px; font-weight: 600;">${elementInfo.component.name}</div>
          <div style="opacity: 0.8; margin-top: 4px;">&lt;${elementInfo.component.selector}&gt;</div>
        </div>
      `;

      // Display signals
      const signals = elementInfo.component.signals || {};
      if (Object.keys(signals).length > 0) {
        detailsHTML += `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; opacity: 0.7; text-transform: uppercase; margin-bottom: 12px;">📊 Signals & State</div>
            <div style="background: rgba(0, 0, 0, 0.3); padding: 16px; border-radius: 8px;">
        `;

        Object.entries(signals).forEach(([name, value]) => {
          const valueStr = this.formatValue(value);
          detailsHTML += `
            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
              <div style="color: #ffd700; font-weight: 600; margin-bottom: 4px;">${name}</div>
              <div style="opacity: 0.9; font-size: 13px; word-break: break-word;">${valueStr}</div>
            </div>
          `;
        });

        detailsHTML += `</div></div>`;
      }
    } else {
      detailsHTML += `
        <div style="margin-bottom: 20px;">
          <div style="font-size: 12px; opacity: 0.7; text-transform: uppercase; margin-bottom: 8px;">Element</div>
          <div style="font-size: 18px; font-weight: 600;">${elementInfo.selector}</div>
        </div>
      `;
    }

    // Display classes
    if (elementInfo.classList.length > 0) {
      detailsHTML += `
        <div style="margin-bottom: 20px;">
          <div style="font-size: 12px; opacity: 0.7; text-transform: uppercase; margin-bottom: 8px;">Classes</div>
          <div style="background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 8px;">
            ${elementInfo.classList.map(cls => `<span style="background: rgba(255, 255, 255, 0.2); padding: 4px 8px; border-radius: 4px; margin: 4px; display: inline-block;">${cls}</span>`).join('')}
          </div>
        </div>
      `;
    }

    // Display dimensions
    detailsHTML += `
      <div>
        <div style="font-size: 12px; opacity: 0.7; text-transform: uppercase; margin-bottom: 8px;">Dimensions</div>
        <div style="background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 8px;">
          ${Math.round(elementInfo.boundingRect.width)} × ${Math.round(elementInfo.boundingRect.height)} px
        </div>
      </div>
    `;

    detailsHTML += `</div>`;

    // Close button
    detailsHTML += `
      <div style="padding: 20px; border-top: 1px solid rgba(255, 255, 255, 0.2); text-align: right;">
        <button id="close-component-modal" style="
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        ">Close</button>
      </div>
    `;

    content.innerHTML = detailsHTML;
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Close handlers
    const closeModal = () => modal.remove();
    document.getElementById('close-component-modal')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      #close-component-modal:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Format value for display
   */
  private formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Object]';
      }
    }
    return String(value);
  }

  /**
   * Get information about selected element
   */
  getSelectedElementInfo(): string | null {
    const selected = this.selectedElement();
    if (!selected) return null;

    const lines: string[] = [];

    lines.push(`Element: <${selected.selector}>`);

    if (selected.component) {
      lines.push(`Component: ${selected.component.name}`);
      lines.push(`Selector: ${selected.component.selector}`);

      if (Object.keys(selected.component.signals || {}).length > 0) {
        lines.push(`\nSignals:`);
        Object.entries(selected.component.signals || {}).forEach(([name, value]) => {
          lines.push(`  ${name}: ${JSON.stringify(value)}`);
        });
      }
    }

    if (selected.classList.length > 0) {
      lines.push(`\nClasses: ${selected.classList.join(', ')}`);
    }

    lines.push(`\nSize: ${Math.round(selected.boundingRect.width)}x${Math.round(selected.boundingRect.height)}`);

    return lines.join('\n');
  }
}
