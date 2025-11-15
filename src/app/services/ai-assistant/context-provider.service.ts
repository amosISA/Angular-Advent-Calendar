import { Injectable, ApplicationRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppContext, ComponentInfo, RouteInfo } from './models';

/**
 * ContextProviderService
 * Serializes the current Angular application state into a format
 * that the AI can understand and work with
 */
@Injectable({
  providedIn: 'root'
})
export class ContextProviderService {
  private appRef = inject(ApplicationRef);
  private router = inject(Router);

  /**
   * Get complete application context for AI
   */
  getAppContext(): AppContext {
    return {
      components: this.getComponentsInfo(),
      routes: this.getRoutesInfo(),
      currentRoute: this.router.url,
      currentUrl: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: Date.now()
    };
  }

  /**
   * Extract information about all components in the application
   */
  private getComponentsInfo(): ComponentInfo[] {
    const components: ComponentInfo[] = [];

    try {
      // Get all component elements in the DOM
      const allElements = document.querySelectorAll('*');

      allElements.forEach(element => {
        const tagName = element.tagName.toLowerCase();

        // Check if it's an Angular component (contains hyphen or is app-root)
        if (tagName.includes('-') || tagName === 'app-root') {
          const componentInfo = this.extractComponentInfo(element as HTMLElement);
          if (componentInfo) {
            components.push(componentInfo);
          }
        }
      });

      // Remove duplicates based on selector
      return this.deduplicateComponents(components);
    } catch (error) {
      console.error('Error getting components info:', error);
      return [];
    }
  }

  /**
   * Extract component information from a DOM element
   */
  private extractComponentInfo(element: HTMLElement): ComponentInfo | null {
    try {
      const selector = element.tagName.toLowerCase();

      // Try to get Angular component instance (works in dev mode)
      let instance: any = null;
      let signals: Record<string, any> = {};

      try {
        // @ts-ignore - ng is available in development mode
        if (typeof ng !== 'undefined' && ng.probe) {
          // @ts-ignore
          const debugElement = ng.probe(element);
          if (debugElement) {
            instance = debugElement.componentInstance;

            // Extract signals if available
            if (instance) {
              signals = this.extractSignals(instance);
            }
          }
        }
      } catch (e) {
        // ng.probe not available or failed
      }

      return {
        selector,
        name: this.getComponentName(selector),
        element,
        instance,
        signals,
        isStandalone: true, // Angular 20 uses standalone by default
        inputs: this.extractInputs(element),
        outputs: this.extractOutputs(element)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract signal values from component instance
   */
  private extractSignals(instance: any): Record<string, any> {
    const signals: Record<string, any> = {};

    try {
      // Look for properties that might be signals
      const proto = Object.getPrototypeOf(instance);
      const propertyNames = Object.getOwnPropertyNames(proto);

      propertyNames.forEach(name => {
        try {
          const value = instance[name];
          // Check if it's a signal (has a call signature)
          if (value && typeof value === 'function' && value.length === 0) {
            try {
              const signalValue = value.call(instance);
              signals[name] = signalValue;
            } catch (e) {
              // Not a signal
            }
          }
        } catch (e) {
          // Property not accessible
        }
      });
    } catch (error) {
      // Failed to extract signals
    }

    return signals;
  }

  /**
   * Extract input bindings from element
   */
  private extractInputs(element: HTMLElement): Record<string, any> {
    const inputs: Record<string, any> = {};

    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('[') && attr.name.endsWith(']')) {
        const inputName = attr.name.slice(1, -1);
        inputs[inputName] = attr.value;
      }
    });

    return inputs;
  }

  /**
   * Extract output bindings from element
   */
  private extractOutputs(element: HTMLElement): string[] {
    const outputs: string[] = [];

    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('(') && attr.name.endsWith(')')) {
        const outputName = attr.name.slice(1, -1);
        outputs.push(outputName);
      }
    });

    return outputs;
  }

  /**
   * Get human-readable component name from selector
   */
  private getComponentName(selector: string): string {
    // Convert app-advent-calendar to AdventCalendar
    return selector
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  /**
   * Remove duplicate components (same selector)
   */
  private deduplicateComponents(components: ComponentInfo[]): ComponentInfo[] {
    const seen = new Map<string, ComponentInfo>();

    components.forEach(comp => {
      if (!seen.has(comp.selector)) {
        seen.set(comp.selector, comp);
      }
    });

    return Array.from(seen.values());
  }

  /**
   * Get routes information
   */
  private getRoutesInfo(): RouteInfo[] {
    try {
      const routes = this.router.config;
      return routes.map(route => this.mapRoute(route));
    } catch (error) {
      console.error('Error getting routes info:', error);
      return [];
    }
  }

  /**
   * Map Angular Route to RouteInfo
   */
  private mapRoute(route: any): RouteInfo {
    return {
      path: route.path || '',
      component: route.component?.name || undefined,
      children: route.children?.map((r: any) => this.mapRoute(r)),
      data: route.data
    };
  }

  /**
   * Get summary text for AI context
   */
  getContextSummary(): string {
    const context = this.getAppContext();

    return `
Current Application State:
- Current Route: ${context.currentRoute}
- Components on Page: ${context.components.map(c => c.selector).join(', ')}
- Total Routes: ${context.routes.length}
- Viewport: ${context.viewport.width}x${context.viewport.height}
- Components with Signals: ${context.components.filter(c => Object.keys(c.signals || {}).length > 0).length}
    `.trim();
  }

  /**
   * Get detailed component information by selector
   */
  getComponentBySelector(selector: string): ComponentInfo | null {
    const components = this.getComponentsInfo();
    return components.find(c => c.selector === selector) || null;
  }

  /**
   * Count elements by selector on current page
   */
  countElements(selector: string): number {
    return document.querySelectorAll(selector).length;
  }
}
