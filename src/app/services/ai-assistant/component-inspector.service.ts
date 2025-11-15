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
  highlightComponents(selectors: string[], duration: number = 3000): void {
    this.clearHighlights();

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element, index) => {
        this.createHighlight(element as HTMLElement, selector, index);
      });
    });

    this.highlightedSelectors.set(selectors);

    // Auto-clear after duration
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
    `;

    // Add label
    const label = document.createElement('div');
    label.textContent = selector;
    label.style.cssText = `
      position: absolute;
      top: -28px;
      left: 0;
      background: #4285f4;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-family: 'Courier New', monospace;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    `;
    highlight.appendChild(label);

    document.body.appendChild(highlight);
    this.highlightElements.set(key, highlight);

    // Update position on scroll/resize
    const updatePosition = () => {
      const newRect = element.getBoundingClientRect();
      highlight.style.top = `${newRect.top}px`;
      highlight.style.left = `${newRect.left}px`;
      highlight.style.width = `${newRect.width}px`;
      highlight.style.height = `${newRect.height}px`;
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
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
      border: 2px solid ${borderColor};
      background: ${isComponent ? 'rgba(52, 168, 83, 0.1)' : 'rgba(251, 188, 4, 0.1)'};
      pointer-events: none;
      z-index: 999997;
      border-radius: 2px;
    `;

    // Add info tooltip
    const tooltip = document.createElement('div');
    const componentInfo = this.hoveredElement();
    const tooltipText = componentInfo?.component
      ? `<${componentInfo.component.selector}>`
      : element.tagName.toLowerCase();

    tooltip.innerHTML = tooltipText;
    tooltip.style.cssText = `
      position: absolute;
      bottom: -32px;
      left: 0;
      background: ${borderColor};
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-family: 'Courier New', monospace;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
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
