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

  /**
   * Get component tree hierarchy
   * Returns a nested structure representing the component tree
   */
  getComponentTree(): ComponentTreeNode {
    const root: ComponentTreeNode = {
      selector: 'app-root',
      name: 'AppComponent',
      children: [],
      depth: 0
    };

    const appRoot = document.querySelector('app-root');
    if (appRoot) {
      this.buildComponentTree(appRoot as HTMLElement, root, 0);
    }

    return root;
  }

  /**
   * Build component tree recursively
   */
  private buildComponentTree(element: HTMLElement, node: ComponentTreeNode, depth: number): void {
    // Find all direct child components
    const children = Array.from(element.children) as HTMLElement[];

    for (const child of children) {
      if (this.isAngularComponent(child)) {
        const componentInfo = this.findComponentForElement(child);
        const childNode: ComponentTreeNode = {
          selector: child.tagName.toLowerCase(),
          name: componentInfo?.name || child.tagName,
          children: [],
          depth: depth + 1,
          signals: componentInfo?.signals,
          inputs: componentInfo?.inputs,
          outputs: componentInfo?.outputs
        };

        node.children.push(childNode);
        this.buildComponentTree(child, childNode, depth + 1);
      } else {
        // Continue searching in non-component elements
        this.buildComponentTree(child, node, depth);
      }
    }
  }

  /**
   * Format component tree as string
   */
  formatComponentTree(node: ComponentTreeNode = this.getComponentTree(), indent: string = ''): string {
    let result = `${indent}${node.selector}`;

    if (node.signals && Object.keys(node.signals).length > 0) {
      result += ` [${Object.keys(node.signals).length} signals]`;
    }

    result += '\n';

    for (const child of node.children) {
      result += this.formatComponentTree(child, indent + '  ');
    }

    return result;
  }

  /**
   * Get injector tree information
   * Shows the dependency injection hierarchy
   */
  getInjectorTree(): InjectorTreeNode {
    const components = this.getAllComponents();

    return {
      name: 'Root Injector',
      providers: ['ApplicationRef', 'EnvironmentInjector', 'Compiler'],
      children: components.map(comp => ({
        name: comp.name,
        selector: comp.selector,
        providers: this.getComponentProviders(comp),
        injections: this.getComponentInjections(comp)
      }))
    };
  }

  /**
   * Get providers for a component
   */
  private getComponentProviders(component: ComponentInfo): string[] {
    // This would require runtime metadata access
    // For now, return placeholder
    return component.isStandalone ? ['Standalone'] : ['NgModule'];
  }

  /**
   * Get injections (dependencies) for a component
   */
  private getComponentInjections(component: ComponentInfo): string[] {
    // Extract service names from instance if available
    if (!component.instance) return [];

    const injections: string[] = [];
    const proto = Object.getPrototypeOf(component.instance);

    // Try to find injected services (this is a best-effort approach)
    for (const key in component.instance) {
      if (key.startsWith('_') || key.includes('Service') || key.includes('Store')) {
        injections.push(key);
      }
    }

    return injections.slice(0, 10); // Limit to avoid clutter
  }

  /**
   * Format injector tree as string
   */
  formatInjectorTree(node: InjectorTreeNode = this.getInjectorTree(), indent: string = ''): string {
    let result = `${indent}${node.name}\n`;

    if (node.providers && node.providers.length > 0) {
      result += `${indent}  Providers: ${node.providers.join(', ')}\n`;
    }

    if (node.injections && node.injections.length > 0) {
      result += `${indent}  Injections: ${node.injections.join(', ')}\n`;
    }

    if (node.children) {
      for (const child of node.children) {
        result += this.formatInjectorTree(child, indent + '  ');
      }
    }

    return result;
  }

  /**
   * Get reactivity graph (signal dependencies)
   * Analyzes which signals depend on each other
   */
  getReactivityGraph(): ReactivityNode[] {
    const components = this.getAllComponents();
    const nodes: ReactivityNode[] = [];

    for (const comp of components) {
      const signals = comp.signals || {};

      for (const [signalName, value] of Object.entries(signals)) {
        nodes.push({
          component: comp.selector,
          signalName,
          currentValue: value,
          type: this.detectSignalType(value),
          dependencies: [] // Would need deeper analysis to detect computed signal dependencies
        });
      }
    }

    return nodes;
  }

  /**
   * Detect signal type (signal, computed, etc.)
   */
  private detectSignalType(value: any): 'signal' | 'computed' | 'unknown' {
    // This is a simplified detection
    // Real implementation would need access to Angular's internal signal metadata
    if (typeof value === 'object' && value !== null) {
      return 'computed';
    }
    return 'signal';
  }

  /**
   * Format reactivity graph as string
   */
  formatReactivityGraph(): string {
    const nodes = this.getReactivityGraph();
    let result = '**Reactivity Graph:**\n\n';

    const byComponent = nodes.reduce((acc, node) => {
      if (!acc[node.component]) {
        acc[node.component] = [];
      }
      acc[node.component].push(node);
      return acc;
    }, {} as Record<string, ReactivityNode[]>);

    for (const [component, signals] of Object.entries(byComponent)) {
      result += `${component}:\n`;
      for (const signal of signals) {
        result += `  ├─ ${signal.signalName}: ${JSON.stringify(signal.currentValue)} (${signal.type})\n`;
        if (signal.dependencies.length > 0) {
          result += `  │  └─ depends on: ${signal.dependencies.join(', ')}\n`;
        }
      }
      result += '\n';
    }

    return result;
  }

  /**
   * Get change detection path
   * Shows the order components are checked during change detection
   */
  getChangeDetectionPath(): string {
    const tree = this.getComponentTree();
    const path: string[] = [];

    this.traverseTreeForCD(tree, path);

    return path.join(' → ');
  }

  /**
   * Traverse tree in change detection order (depth-first)
   */
  private traverseTreeForCD(node: ComponentTreeNode, path: string[]): void {
    path.push(node.selector);

    for (const child of node.children) {
      this.traverseTreeForCD(child, path);
    }
  }
}

/**
 * Component tree node interface
 */
export interface ComponentTreeNode {
  selector: string;
  name: string;
  children: ComponentTreeNode[];
  depth: number;
  signals?: Record<string, any>;
  inputs?: Record<string, any>;
  outputs?: string[];
}

/**
 * Injector tree node interface
 */
export interface InjectorTreeNode {
  name: string;
  selector?: string;
  providers?: string[];
  injections?: string[];
  children?: InjectorTreeNode[];
}

/**
 * Reactivity graph node interface
 */
export interface ReactivityNode {
  component: string;
  signalName: string;
  currentValue: any;
  type: 'signal' | 'computed' | 'unknown';
  dependencies: string[];
}

