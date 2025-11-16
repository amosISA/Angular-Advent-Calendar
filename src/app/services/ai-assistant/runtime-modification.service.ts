import { Injectable, inject, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { AngularIntrospectionService } from './angular-introspection.service';
import { ComponentInspectorService } from './component-inspector.service';
import { RuntimeComponentCompilerService, ComponentCode } from './runtime-component-compiler.service';

/**
 * RuntimeModificationService
 * Handles dynamic modifications to the application at runtime
 * Executes AI-generated actions safely
 */
@Injectable({
  providedIn: 'root'
})
export class RuntimeModificationService {
  private introspection = inject(AngularIntrospectionService);
  private inspector = inject(ComponentInspectorService);
  private compiler = inject(RuntimeComponentCompilerService);
  private appRef = inject(ApplicationRef);
  private environmentInjector = inject(EnvironmentInjector);

  /**
   * Execute an AI action
   */
  async executeAction(action: any): Promise<{ success: boolean; message: string }> {
    if (!action || !action.type) {
      return { success: false, message: 'Invalid action' };
    }

    try {
      switch (action.type) {
        case 'HIGHLIGHT_COMPONENTS':
          return this.highlightComponents(action.payload);

        case 'LIST_COMPONENTS':
          return this.listComponents();

        case 'INSPECT_ELEMENT':
          return this.toggleInspector(action.payload);

        case 'MODIFY_PROPERTY':
          return this.modifyProperty(action.payload);

        case 'CHANGE_STYLE':
          return this.changeStyle(action.payload);

        case 'CREATE_COMPONENT':
          return await this.createComponent(action.payload);

        case 'EXPLAIN_CODE':
        case 'NONE':
          return { success: true, message: 'No action needed' };

        default:
          return { success: false, message: `Unknown action type: ${action.type}` };
      }
    } catch (error: any) {
      console.error('Error executing action:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Highlight components by selectors
   */
  private highlightComponents(payload: any): { success: boolean; message: string } {
    const { selectors, duration = 3000 } = payload;

    if (!selectors || !Array.isArray(selectors)) {
      return { success: false, message: 'Invalid selectors' };
    }

    this.inspector.highlightComponents(selectors, duration);

    return {
      success: true,
      message: `Highlighted ${selectors.length} component(s)`
    };
  }

  /**
   * List all components
   */
  private listComponents(): { success: boolean; message: string } {
    const components = this.introspection.getAllComponents();
    const componentList = components
      .map(c => `- ${c.selector} (${c.name})`)
      .join('\n');

    return {
      success: true,
      message: `Found ${components.length} components:\n${componentList}`
    };
  }

  /**
   * Toggle element inspector
   */
  private toggleInspector(payload: any): { success: boolean; message: string } {
    const { enabled } = payload;

    if (enabled) {
      this.inspector.startInspection();
      return {
        success: true,
        message: 'Element inspector enabled. Click to select an element, ESC to cancel.'
      };
    } else {
      this.inspector.stopInspection();
      return {
        success: true,
        message: 'Element inspector disabled'
      };
    }
  }

  /**
   * Modify component property (including signals)
   */
  private modifyProperty(payload: any): { success: boolean; message: string } {
    const { componentSelector, propertyPath, value } = payload;

    if (!componentSelector || !propertyPath) {
      return { success: false, message: 'Missing component selector or property path' };
    }

    const success = this.introspection.setComponentProperty(
      componentSelector,
      propertyPath,
      value
    );

    if (success) {
      return {
        success: true,
        message: `Updated ${componentSelector}.${propertyPath} = ${JSON.stringify(value)}`
      };
    } else {
      return {
        success: false,
        message: `Failed to update property. Component or property not found.`
      };
    }
  }

  /**
   * Change element styles dynamically
   */
  private changeStyle(payload: any): { success: boolean; message: string } {
    const { selector, styles } = payload;

    if (!selector || !styles) {
      return { success: false, message: 'Missing selector or styles' };
    }

    try {
      const elements = document.querySelectorAll(selector);

      if (elements.length === 0) {
        return { success: false, message: `No elements found for selector: ${selector}` };
      }

      elements.forEach(element => {
        Object.entries(styles).forEach(([property, value]) => {
          (element as HTMLElement).style.setProperty(property, value as string);
        });
      });

      return {
        success: true,
        message: `Applied styles to ${elements.length} element(s)`
      };
    } catch (error: any) {
      return { success: false, message: `Error applying styles: ${error.message}` };
    }
  }

  /**
   * Create a component at runtime using Angular's JIT compiler
   */
  private async createComponent(payload: any): Promise<{ success: boolean; message: string }> {
    const { componentCode, position = 'bottom' } = payload;

    if (!componentCode || !componentCode.template) {
      return { success: false, message: 'Invalid component code. Must include template.' };
    }

    try {
      // Create the component class using the compiler service
      const componentClass = this.compiler.createComponentClass(componentCode);

      // Create the Angular component instance (Angular creates the element with proper selector)
      const componentRef = createComponent(componentClass, {
        environmentInjector: this.environmentInjector
      });

      // Get the component's native element (will have the proper selector tag)
      const componentElement = componentRef.location.nativeElement;

      // Attach to Angular's change detection
      this.appRef.attachView(componentRef.hostView);

      // Find app-root element
      const appRoot = document.querySelector('app-root') as HTMLElement;
      if (!appRoot) {
        componentRef.destroy();
        return { success: false, message: 'Could not find app-root element' };
      }

      // Determine insertion position within app-root
      let targetElement: HTMLElement | null = null;
      let insertBefore = false;

      switch (position) {
        case 'top':
          // Insert at the beginning of app-root
          targetElement = appRoot as HTMLElement;
          insertBefore = true;
          break;
        case 'bottom':
          // Insert at the end of app-root
          targetElement = appRoot as HTMLElement;
          insertBefore = false;
          break;
        case 'before-calendar':
          targetElement = appRoot.querySelector('app-advent-calendar') as HTMLElement;
          insertBefore = true;
          break;
        case 'after-calendar':
          targetElement = appRoot.querySelector('app-advent-calendar') as HTMLElement;
          insertBefore = false;
          break;
        default:
          targetElement = appRoot as HTMLElement;
          insertBefore = false;
      }

      if (!targetElement) {
        componentRef.destroy();
        return { success: false, message: 'Could not find target element for insertion' };
      }

      // Insert component element at specified position
      if (insertBefore && targetElement === appRoot) {
        // Insert at beginning of app-root
        appRoot.insertBefore(componentElement, appRoot.firstChild);
      } else if (insertBefore && targetElement.parentNode) {
        // Insert before specific element
        targetElement.parentNode.insertBefore(componentElement, targetElement);
      } else if (targetElement === appRoot) {
        // Append to end of app-root
        appRoot.appendChild(componentElement);
      } else {
        // Insert after specific element
        if (targetElement.nextSibling) {
          targetElement.parentNode?.insertBefore(componentElement, targetElement.nextSibling);
        } else {
          targetElement.parentNode?.appendChild(componentElement);
        }
      }

      // Store reference for cleanup
      this.compiler.createdComponents.update((map: Map<string, any>) => {
        const newMap = new Map(map);
        newMap.set(componentCode.name, componentRef);
        return newMap;
      });

      const positionText = position === 'top' ? 'at the top' :
                          position === 'bottom' ? 'at the bottom' :
                          position === 'before-calendar' ? 'before the calendar' :
                          position === 'after-calendar' ? 'after the calendar' :
                          'in the app';

      return {
        success: true,
        message: `Component "${componentCode.name || 'DynamicComponent'}" created ${positionText}!`
      };
    } catch (error: any) {
      console.error('Component creation error:', error);
      return {
        success: false,
        message: `Failed to create component: ${error.message}`
      };
    }
  }

  /**
   * Validate action before execution
   */
  validateAction(action: any): { valid: boolean; reason?: string } {
    if (!action || typeof action !== 'object') {
      return { valid: false, reason: 'Action must be an object' };
    }

    if (!action.type) {
      return { valid: false, reason: 'Action must have a type' };
    }

    const validTypes = [
      'HIGHLIGHT_COMPONENTS',
      'LIST_COMPONENTS',
      'INSPECT_ELEMENT',
      'MODIFY_PROPERTY',
      'CHANGE_STYLE',
      'CREATE_COMPONENT',
      'EXPLAIN_CODE',
      'NONE'
    ];

    if (!validTypes.includes(action.type)) {
      return { valid: false, reason: `Invalid action type: ${action.type}` };
    }

    // Validate payload based on action type
    switch (action.type) {
      case 'HIGHLIGHT_COMPONENTS':
        if (!action.payload?.selectors || !Array.isArray(action.payload.selectors)) {
          return { valid: false, reason: 'HIGHLIGHT_COMPONENTS requires selectors array' };
        }
        break;

      case 'MODIFY_PROPERTY':
        if (!action.payload?.componentSelector || !action.payload?.propertyPath) {
          return { valid: false, reason: 'MODIFY_PROPERTY requires componentSelector and propertyPath' };
        }
        break;

      case 'CHANGE_STYLE':
        if (!action.payload?.selector || !action.payload?.styles) {
          return { valid: false, reason: 'CHANGE_STYLE requires selector and styles' };
        }
        break;

      case 'INSPECT_ELEMENT':
        if (typeof action.payload?.enabled !== 'boolean') {
          return { valid: false, reason: 'INSPECT_ELEMENT requires boolean enabled flag' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Get all available actions and their descriptions
   */
  getAvailableActions(): Array<{ type: string; description: string; example: any }> {
    return [
      {
        type: 'HIGHLIGHT_COMPONENTS',
        description: 'Highlight components on the page with a pulsing border',
        example: {
          type: 'HIGHLIGHT_COMPONENTS',
          payload: { selectors: ['app-advent-calendar'], duration: 3000 }
        }
      },
      {
        type: 'LIST_COMPONENTS',
        description: 'List all Angular components on the current page',
        example: {
          type: 'LIST_COMPONENTS',
          payload: null
        }
      },
      {
        type: 'INSPECT_ELEMENT',
        description: 'Enable/disable element inspector mode',
        example: {
          type: 'INSPECT_ELEMENT',
          payload: { enabled: true }
        }
      },
      {
        type: 'MODIFY_PROPERTY',
        description: 'Modify a component property or signal at runtime',
        example: {
          type: 'MODIFY_PROPERTY',
          payload: {
            componentSelector: 'app-advent-calendar',
            propertyPath: 'currentDay',
            value: 25
          }
        }
      },
      {
        type: 'CHANGE_STYLE',
        description: 'Change CSS styles of elements',
        example: {
          type: 'CHANGE_STYLE',
          payload: {
            selector: '.header h1',
            styles: { color: 'red', fontSize: '32px' }
          }
        }
      }
    ];
  }
}
