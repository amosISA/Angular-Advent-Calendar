import { Injectable, Compiler, ViewContainerRef, ComponentRef, Type, inject, createComponent, EnvironmentInjector, signal } from '@angular/core';
import { Component as ComponentDecorator } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Component code structure
 */
export interface ComponentCode {
  selector: string;
  template: string;
  styles?: string;
  typescript?: string;
  name: string;
}

/**
 * RuntimeComponentCompilerService
 * Compiles and renders Angular components at runtime
 * Allows AI to dynamically create components
 */
@Injectable({
  providedIn: 'root'
})
export class RuntimeComponentCompilerService {
  private compiler = inject(Compiler);
  private environmentInjector = inject(EnvironmentInjector);

  // Store created components (public for runtime modification service)
  createdComponents = signal<Map<string, ComponentRef<any>>>(new Map());

  /**
   * Compile and create a component from code at runtime
   */
  async compileAndCreateComponent(
    componentCode: ComponentCode,
    container: ViewContainerRef
  ): Promise<ComponentRef<any>> {
    try {
      // Create component class dynamically
      const componentClass = this.createComponentClass(componentCode);

      // Clear container
      container.clear();

      // Create component instance
      const componentRef = createComponent(componentClass, {
        environmentInjector: this.environmentInjector,
        hostElement: container.element.nativeElement
      });

      // Store reference
      this.createdComponents.update(map => {
        const newMap = new Map(map);
        newMap.set(componentCode.name, componentRef);
        return newMap;
      });

      // Attach to container
      container.insert(componentRef.hostView);

      return componentRef;
    } catch (error) {
      console.error('Component compilation error:', error);
      throw new Error(`Failed to compile component: ${error}`);
    }
  }

  /**
   * Create a component class from code
   */
  createComponentClass(componentCode: ComponentCode): Type<any> {
    // Parse TypeScript code if provided
    let componentLogic: any = {};

    if (componentCode.typescript) {
      try {
        // Create a function that returns the component logic
        // We need to ensure signal and inject are available in the execution context
        const func = new Function('signal', 'inject', `
          ${componentCode.typescript}
          return componentLogic;
        `);

        // Execute the function with Angular's signal and inject
        componentLogic = func(signal, inject);
      } catch (error) {
        console.warn('TypeScript parsing error, using empty logic:', error);
        console.error('TypeScript code:', componentCode.typescript);
      }
    }

    // Create component class dynamically
    class DynamicComponent {
      constructor() {
        console.log('[RuntimeCompiler] Creating component, componentLogic keys:', Object.keys(componentLogic));

        // First pass: assign all non-function properties (including signals)
        Object.keys(componentLogic).forEach(key => {
          const value = componentLogic[key];

          // Check if it's a signal by checking if it has update/set methods
          if (typeof value === 'function' && value.set && value.update) {
            console.log(`[RuntimeCompiler] Assigning signal: ${key}`);
            (this as any)[key] = value;
          } else if (typeof value !== 'function') {
            console.log(`[RuntimeCompiler] Assigning property: ${key}`, value);
            (this as any)[key] = value;
          }
        });

        // Second pass: bind all methods (after properties are set)
        Object.keys(componentLogic).forEach(key => {
          const value = componentLogic[key];

          if (typeof value === 'function' && !value.set && !value.update) {
            console.log(`[RuntimeCompiler] Binding method: ${key}`);
            // Bind the method to this component instance
            (this as any)[key] = value.bind(this);
          }
        });

        console.log('[RuntimeCompiler] Component instance created with:', Object.keys(this));
      }
    }

    // Apply component metadata dynamically to avoid AOT issues
    const metadata = {
      selector: componentCode.selector,
      template: componentCode.template as string,
      styles: componentCode.styles ? [componentCode.styles as string] : [],
      standalone: true,
      imports: [CommonModule]
    };

    // Use ComponentDecorator at runtime
    return ComponentDecorator(metadata)(DynamicComponent as any) as Type<any>;
  }

  /**
   * Generate component code from AI description
   */
  generateComponentTemplate(description: string): ComponentCode {
    // This is a helper to structure component code
    // The AI will provide the actual content
    return {
      selector: 'app-dynamic-component',
      name: 'DynamicComponent',
      template: '<div>Component content here</div>',
      styles: ''
    };
  }

  /**
   * Destroy a created component
   */
  destroyComponent(name: string): void {
    const component = this.createdComponents().get(name);
    if (component) {
      component.destroy();
      this.createdComponents.update(map => {
        const newMap = new Map(map);
        newMap.delete(name);
        return newMap;
      });
    }
  }

  /**
   * Get all created components
   */
  getCreatedComponents(): Map<string, ComponentRef<any>> {
    return this.createdComponents();
  }

  /**
   * Clear all created components
   */
  clearAllComponents(): void {
    this.createdComponents().forEach(component => component.destroy());
    this.createdComponents.set(new Map());
  }
}
