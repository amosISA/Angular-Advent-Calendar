import { Injectable, inject } from '@angular/core';
import { ContextProviderService } from './context-provider.service';
import { ComponentInfo, ElementInfo } from './models';

/**
 * AngularIntrospectionService
 * Provides deep introspection into Angular runtime
 * Maps DOM elements to Angular components and their state
 */
@Injectable({
  providedIn: 'root'
})
export class AngularIntrospectionService {
  private contextProvider = inject(ContextProviderService);

  /**
   * Get all Angular components currently rendered
   */
  getAllComponents(): ComponentInfo[] {
    return this.contextProvider.getAppContext().components;
  }

  /**
   * Find component by selector
   */
  findComponent(selector: string): ComponentInfo | null {
    return this.contextProvider.getComponentBySelector(selector);
  }

  /**
   * Get element information including associated component
   */
  getElementInfo(element: HTMLElement): ElementInfo {
    const componentInfo = this.findComponentForElement(element);
    const rect = element.getBoundingClientRect();

    return {
      element,
      component: componentInfo,
      selector: element.tagName.toLowerCase(),
      classList: Array.from(element.classList),
      boundingRect: rect,
      computedStyles: this.getRelevantStyles(element)
    };
  }

  /**
   * Find the closest Angular component for a DOM element
   */
  findComponentForElement(element: HTMLElement): ComponentInfo | null {
    let current: HTMLElement | null = element;

    while (current) {
      const tagName = current.tagName.toLowerCase();

      // Check if this element is an Angular component
      if (tagName.includes('-') || tagName === 'app-root') {
        const componentInfo = this.contextProvider.getComponentBySelector(tagName);
        if (componentInfo) {
          return componentInfo;
        }
      }

      current = current.parentElement;
    }

    return null;
  }

  /**
   * Get relevant computed styles for an element
   */
  private getRelevantStyles(element: HTMLElement): Partial<CSSStyleDeclaration> {
    const computed = window.getComputedStyle(element);
    const relevantProps = [
      'display', 'position', 'width', 'height',
      'backgroundColor', 'color', 'fontSize',
      'padding', 'margin', 'border', 'zIndex'
    ];

    const styles: any = {};
    relevantProps.forEach(prop => {
      styles[prop] = computed.getPropertyValue(prop);
    });

    return styles;
  }

  /**
   * Get all elements for a component selector
   */
  getComponentElements(selector: string): HTMLElement[] {
    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }

  /**
   * Analyze component hierarchy
   */
  getComponentHierarchy(): string {
    const components = this.getAllComponents();
    const hierarchy: string[] = [];

    components.forEach(comp => {
      const count = this.contextProvider.countElements(comp.selector);
      hierarchy.push(`${comp.selector} (${count} instance${count !== 1 ? 's' : ''})`);
    });

    return hierarchy.join('\n');
  }

  /**
   * Check if element is an Angular component
   */
  isAngularComponent(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return tagName.includes('-') || tagName === 'app-root';
  }

  /**
   * Get component property value
   */
  getComponentProperty(selector: string, propertyPath: string): any {
    const component = this.findComponent(selector);
    if (!component || !component.instance) {
      return null;
    }

    try {
      // Navigate property path (e.g., "user.name")
      const parts = propertyPath.split('.');
      let value: any = component.instance;

      for (const part of parts) {
        if (value === null || value === undefined) {
          return null;
        }

        // Try to call if it's a function (like signals)
        if (typeof value[part] === 'function') {
          value = value[part].call(value);
        } else {
          value = value[part];
        }
      }

      return value;
    } catch (error) {
      console.error('Error getting component property:', error);
      return null;
    }
  }

  /**
   * Set component property value
   */
  setComponentProperty(selector: string, propertyPath: string, value: any): boolean {
    const component = this.findComponent(selector);
    if (!component || !component.instance) {
      return false;
    }

    try {
      const parts = propertyPath.split('.');
      const propertyName = parts.pop();
      if (!propertyName) return false;

      let target: any = component.instance;

      // Navigate to the parent object
      for (const part of parts) {
        if (target === null || target === undefined) {
          return false;
        }
        target = target[part];
      }

      // Check if it's a signal
      if (typeof target[propertyName] === 'function' && target[propertyName].set) {
        // It's a signal, use .set()
        target[propertyName].set(value);
      } else {
        // Regular property
        target[propertyName] = value;
      }

      return true;
    } catch (error) {
      console.error('Error setting component property:', error);
      return false;
    }
  }

  /**
   * Get detailed analysis of a component
   */
  analyzeComponent(selector: string): string {
    const component = this.findComponent(selector);
    if (!component) {
      return `Component '${selector}' not found.`;
    }

    const elements = this.getComponentElements(selector);
    const analysis: string[] = [];

    analysis.push(`Component: ${component.name}`);
    analysis.push(`Selector: ${component.selector}`);
    analysis.push(`Instances: ${elements.length}`);
    analysis.push(`Standalone: ${component.isStandalone ? 'Yes' : 'No'}`);

    if (Object.keys(component.signals || {}).length > 0) {
      analysis.push(`\nSignals:`);
      Object.entries(component.signals || {}).forEach(([name, value]) => {
        analysis.push(`  - ${name}: ${JSON.stringify(value)}`);
      });
    }

    if (Object.keys(component.inputs || {}).length > 0) {
      analysis.push(`\nInputs:`);
      Object.entries(component.inputs || {}).forEach(([name, value]) => {
        analysis.push(`  - ${name}: ${value}`);
      });
    }

    if ((component.outputs || []).length > 0) {
      analysis.push(`\nOutputs:`);
      component.outputs?.forEach(output => {
        analysis.push(`  - ${output}`);
      });
    }

    return analysis.join('\n');
  }

  /**
   * Get element at specific coordinates
   */
  getElementAtPosition(x: number, y: number): ElementInfo | null {
    const element = document.elementFromPoint(x, y) as HTMLElement;
    if (!element) return null;

    return this.getElementInfo(element);
  }

  /**
   * Get all component selectors
   */
  getComponentSelectors(): string[] {
    return this.getAllComponents().map(c => c.selector);
  }
}
