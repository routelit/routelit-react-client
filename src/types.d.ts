interface RouteLitComponent {
  key: string;
  /**
   * The name or type of the component. It could be a html tag name or a custom component name.
   */
  name: string;
  props: Record<string, unknown>;
  children?: RouteLitComponent[];
  address?: number[];
  stale?: boolean;
}

type ActionType =
  | "add"
  | "remove"
  | "update"
  | "set"
  | "fresh_boundary"
  | "last";

interface Action {
  type: string;
  /**
   * The address is the sequence of indices to the array tree of elements in the session state
   * from the root to the target element.
   */
  address: number[];
  target?: "app" | "fragment";
}

interface AddAction extends Action {
  type: "add";
  element: RouteLitComponent;
}

interface SetAction extends Action {
  type: "set";
  element: RouteLitComponent;
}

interface RemoveAction extends Action {
  type: "remove";
}

interface UpdateAction extends Action {
  type: "update";
  props: Record<string, unknown>;
}

interface FreshBoundaryAction extends Action {
  type: "fresh_boundary";
}

interface LastAction extends Action {
  type: "last";
}

interface NoChangeAction extends Action {
  type: "no_change";
}

interface ActionsResponse {
  actions: Action[];
  target: "app" | "fragment";
}

interface UIEventPayload {
  type: string;
  id: string;
  formId?: string;
  [key: string]: unknown;
}

interface NavigateEventPayload extends UIEventPayload {
  type: "navigate";
  href: string;
  lastURL?: string;
  isExternal?: boolean;
  replace?: boolean;
  target?: "_blank" | "_self";
}

interface InitializeEventPayload extends UIEventPayload {
  type: "initialize";
}

interface ChangeEventPayload extends UIEventPayload {
  value: string | number;
}
