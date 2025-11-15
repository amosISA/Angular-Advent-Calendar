/**
 * AI action models for runtime modifications
 */

export type AIActionType =
  | 'HIGHLIGHT_COMPONENTS'
  | 'LIST_COMPONENTS'
  | 'EXPLAIN_CODE'
  | 'INSPECT_ELEMENT'
  | 'MODIFY_PROPERTY'
  | 'ADD_ROUTE'
  | 'CREATE_COMPONENT'
  | 'CHANGE_STYLE'
  | 'NONE';

export interface AIAction {
  type: AIActionType;
  payload?: any;
}

export interface HighlightComponentsAction extends AIAction {
  type: 'HIGHLIGHT_COMPONENTS';
  payload: {
    selectors: string[];
    duration?: number;
  };
}

export interface ModifyPropertyAction extends AIAction {
  type: 'MODIFY_PROPERTY';
  payload: {
    componentSelector: string;
    propertyPath: string;
    value: any;
  };
}

export interface ChangeStyleAction extends AIAction {
  type: 'CHANGE_STYLE';
  payload: {
    selector: string;
    styles: Record<string, string>;
  };
}

export interface AddRouteAction extends AIAction {
  type: 'ADD_ROUTE';
  payload: {
    path: string;
    componentTemplate: string;
  };
}

export interface InspectElementAction extends AIAction {
  type: 'INSPECT_ELEMENT';
  payload: {
    enabled: boolean;
  };
}
