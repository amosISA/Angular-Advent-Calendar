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
    // Store TypeScript code to execute in each instance's constructor
    // This ensures each component instance gets its own signals and methods
    const typescriptCode = componentCode.typescript || '';

    // Create component class dynamically
    class DynamicComponent {
      constructor() {
        // Execute TypeScript code to create component logic for THIS instance
        // This is critical: signals must be created fresh for each instance!
        if (typescriptCode) {
          try {
            const func = new Function('signal', 'inject', `
              ${typescriptCode}
              return componentLogic;
            `);

            // Execute and get fresh componentLogic for this instance
            const componentLogic = func(signal, inject);

            console.log('[RuntimeCompiler] Creating instance with logic keys:', Object.keys(componentLogic));

            // Assign all properties and methods to this instance
            Object.keys(componentLogic).forEach(key => {
              const value = componentLogic[key];

              // Check if it's a signal by checking if it has update/set methods
              if (typeof value === 'function' && value.set && value.update) {
                console.log(`[RuntimeCompiler] ✓ Assigning signal: ${key}`);
                (this as any)[key] = value;
              } else if (typeof value === 'function') {
                console.log(`[RuntimeCompiler] ✓ Binding method: ${key}`);
                // Bind the method to this component instance
                (this as any)[key] = value.bind(this);
              } else {
                console.log(`[RuntimeCompiler] ✓ Assigning property: ${key}`, value);
                (this as any)[key] = value;
              }
            });

            console.log('[RuntimeCompiler] ✅ Component instance ready with:', Object.keys(this));
          } catch (error) {
            console.error('[RuntimeCompiler] ❌ Error creating component logic:', error);
            console.error('TypeScript code:', typescriptCode);
          }
        }
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
