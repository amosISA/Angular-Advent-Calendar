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
        // Execute TypeScript code to get component logic
        // This is simplified - in production you'd use a proper TypeScript compiler
        const func = new Function('signal', 'inject', componentCode.typescript + '; return componentLogic;');
        componentLogic = func(signal, inject);
      } catch (error) {
        console.warn('TypeScript parsing error, using empty logic:', error);
      }
    }

    // Create component class dynamically
    // Note: This uses JIT compilation at runtime, bypassing AOT
    class DynamicComponent {
      // Merge with provided logic
      constructor() {
        Object.assign(this, componentLogic);
      }
    }

    // Apply component metadata dynamically to avoid AOT issues
    const metadata = {
      selector: componentCode.selector,
      template: componentCode.template as string, // Type assertion for runtime
      styles: componentCode.styles ? [componentCode.styles as string] : [],
      standalone: true,
      imports: [CommonModule] // Include CommonModule for directives like *ngIf, *ngFor
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
