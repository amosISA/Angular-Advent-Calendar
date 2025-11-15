import { Injectable, inject } from '@angular/core';
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
   * Create a component at runtime
   */
  private async createComponent(payload: any): Promise<{ success: boolean; message: string }> {
    const { componentCode } = payload;

    if (!componentCode || !componentCode.template) {
      return { success: false, message: 'Invalid component code. Must include template.' };
    }

    try {
      // Get dynamic container and tab navigation from window
      const tabNav = (window as any).__appTabNav;
      const dynamicContainer = (window as any).__appDynamicContainer;

      if (!dynamicContainer) {
        return { success: false, message: 'Dynamic component container not available' };
      }

      // Get container ref
      const container = dynamicContainer.getContainer();

      // Compile and create component
      await this.compiler.compileAndCreateComponent(componentCode, container);

      // Update tab state
      dynamicContainer.setNotEmpty();
      if (tabNav) {
        tabNav.setHasAIContent(true);
        tabNav.setActiveTab('ai-generated');
      }

      return {
        success: true,
        message: `Component "${componentCode.name || 'DynamicComponent'}" created successfully! Check the "AI Generated" tab.`
      };
    } catch (error: any) {
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
