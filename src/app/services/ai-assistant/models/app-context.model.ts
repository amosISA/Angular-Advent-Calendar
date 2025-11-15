/**
 * Application context model for AI assistant
 * Contains all runtime information about the Angular application
 */

export interface ComponentInfo {
  selector: string;
  name: string;
  element: HTMLElement;
  instance?: any;
  inputs?: Record<string, any>;
  outputs?: string[];
  signals?: Record<string, any>;
  isStandalone: boolean;
  path?: string;
}

export interface RouteInfo {
  path: string;
  component?: string;
  children?: RouteInfo[];
  data?: Record<string, any>;
}

export interface AppContext {
  components: ComponentInfo[];
  routes: RouteInfo[];
  currentRoute: string;
  currentUrl: string;
  viewport: {
    width: number;
    height: number;
  };
  timestamp: number;
}

export interface ElementInfo {
  element: HTMLElement;
  component: ComponentInfo | null;
  selector: string;
  classList: string[];
  boundingRect: DOMRect;
  computedStyles?: Partial<CSSStyleDeclaration>;
}
