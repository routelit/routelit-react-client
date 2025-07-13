import { produce } from "immer";
import { applyActions, prependAddressToActions } from "./actions";
import { sendEventStream } from "./server-api";

type Handler = (args: RouteLitComponent[]) => void;
type IsLoadingHandler = (args: boolean) => void;
type ErrorHandler = (args: Error) => void;

interface RouteLitManagerProps {
  componentsTree?: RouteLitComponent[];
  fragmentId?: string;
  parentManager?: RouteLitManager;
  address?: number[];
}

const EMPTY_ARRAY: RouteLitComponent[] = [];
const THROTTLE_DELAY = 125; // 0.125 seconds

export class RouteLitManager {
  private listeners: Array<Handler> = [];
  private isLoadingListeners: Array<IsLoadingHandler> = [];
  private errorListeners: Array<ErrorHandler> = [];
  private componentsTree: RouteLitComponent[] = [];
  private _isLoading: boolean = false;
  private _error?: Error;
  private fragmentId?: string;
  private parentManager?: RouteLitManager;
  private address?: number[];
  private lastURL?: string;
  private initialized: boolean = false;
  private abortController?: AbortController;
  private actionAccumulator: Action[] = [];
  private currentTarget?: string;
  private throttleTimer?: NodeJS.Timeout;
  private lastExecutionTime: number = 0;

  constructor(props: RouteLitManagerProps) {
    this.componentsTree = props.componentsTree ?? [];
    this.fragmentId = props.fragmentId;
    this.parentManager = props.parentManager;
    this.address = props.address;
    this.lastURL = props.parentManager?.getLastURL() ?? window.location.href;
  }

  getLastURL = (): string => {
    return this.parentManager?.getLastURL() ?? this.lastURL!;
  };

  handleEvent = async (e: CustomEvent<UIEventPayload>) => {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    if (e.detail.type === "navigate" && this.fragmentId) {
      // Let the upper manager handle the navigation
      return;
    }

    if (e.detail.type === "navigate") {
      const detail = e.detail as NavigateEventPayload;
      detail.lastURL = this.lastURL;
      this.lastURL = detail.href.startsWith("http")
        ? detail.href
        : window.location.origin + detail.href;
    }
    this._error = undefined;
    this._isLoading = true;
    this.notifyIsLoading();
    try {
      this.abortController = new AbortController();
      const responseStream = sendEventStream(
        e,
        this.fragmentId,
        this.abortController
      );
      for await (const response of responseStream) {
        if ("type" in response) {
          this.batchAction(response);
        } else {
          this.applyActions(response);
        }
      }
    } catch (error) {
      this.handleError(error as Error);
    } finally {
      this._isLoading = false;
      this.notifyIsLoading();
    }
    e.stopPropagation();
  };

  handleError = (e: Error) => {
    this._error = e;
    this.notifyError();
  };

  batchAction = (action: Action, shouldNotify = true) => {
    // For app-level actions in fragments, delegate immediately to parent
    if (this.fragmentId && action.target === "app") {
      this.parentManager?.batchAction(action, shouldNotify);
      return;
    }
    
    // Create a key for grouping actions by target
    const targetKey = action.target || "fragment";
    
    // If this is a new target, flush current actions first
    if (this.currentTarget && this.currentTarget !== targetKey) {
      this.flushActions(shouldNotify);
    }
    
    // Set the current target
    this.currentTarget = targetKey;
    
    // Add action to accumulator
    this.actionAccumulator.push(action);
    
    const now = Date.now();
    
    // If enough time has passed since last execution, execute immediately
    if (now - this.lastExecutionTime >= THROTTLE_DELAY) {
      this.flushActions(shouldNotify);
    } else {
      // If a timer is already set, don't set another one
      if (!this.throttleTimer) {
        const remainingTime = THROTTLE_DELAY - (now - this.lastExecutionTime);
        this.throttleTimer = setTimeout(() => {
          this.flushActions(shouldNotify);
        }, remainingTime);
      }
    }
  };

  private flushActions = (shouldNotify: boolean) => {
    if (this.actionAccumulator.length === 0 || !this.currentTarget) return;
    
    // Clear the timer
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = undefined;
    }
    
    // Record the execution time
    this.lastExecutionTime = Date.now();
    
    // Create ActionsResponse and call applyActions
    const actionsResponse: ActionsResponse = {
      actions: [...this.actionAccumulator],
      target: this.currentTarget as "app" | "fragment"
    };
    
    // Clear the accumulator
    this.actionAccumulator = [];
    this.currentTarget = undefined;
    
    this.applyActions(actionsResponse, shouldNotify);
  };


  applyActions = (actionsResp: ActionsResponse, shouldNotify = true) => {
    if (this.fragmentId) {
      const shouldNotifyParent = actionsResp.target === "app";
      // If the actions are for the app, we don't need to prepend the address
      const actionsWithAddress = shouldNotifyParent
        ? actionsResp
        : prependAddressToActions(actionsResp, this.address!);
      this.parentManager?.applyActions(actionsWithAddress, shouldNotifyParent);
      if (shouldNotify && !shouldNotifyParent) this.notifyListeners();
      return;
    }
    if (actionsResp.actions.length === 0) return;
    const componentsTreeCopy = produce(this.componentsTree, (draft) => {
      applyActions(draft, actionsResp.actions);
    });
    this.componentsTree = componentsTreeCopy;
    if (shouldNotify) this.notifyListeners();
  };

  private initializeDOM = () => {
    if (this.initialized) return;
    const initializeEvent = new CustomEvent<InitializeEventPayload>(
      "routelit:event",
      {
        detail: {
          id: "browser-navigation",
          type: "initialize",
        },
      }
    );
    this.handleEvent(initializeEvent);
    this.initialized = true;
  };

  initialize = () => {
    this.initializeDOM();
    document.addEventListener(
      "routelit:event",
      this.handleEvent as unknown as EventListener
    );
    window.addEventListener("popstate", this.handlePopState as EventListener);
  };

  handlePopState = () => {
    const currentUrl = window.location.href;
    const navigateEvent = new CustomEvent<NavigateEventPayload>(
      "routelit:event",
      {
        detail: {
          type: "navigate",
          id: "browser-navigation",
          href: currentUrl,
          lastURL: this.lastURL,
        },
      }
    );
    document.dispatchEvent(navigateEvent);
  };

  terminate = () => {
    // Flush any pending actions before terminating
    if (this.actionAccumulator.length > 0) {
      this.flushActions(true);
    }
    
    // Clear the timer
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = undefined;
    }
    
    // Clear the accumulator
    this.actionAccumulator = [];
    this.currentTarget = undefined;
    
    document.removeEventListener(
      "routelit:event",
      this.handleEvent as unknown as EventListener
    );
    window.removeEventListener(
      "popstate",
      this.handlePopState as EventListener
    );
  };

  getComponentsTree = (): RouteLitComponent[] => {
    if (this.address) {
      return this.parentManager?.getAtAddress(this.address) ?? EMPTY_ARRAY;
    }
    return this.componentsTree ?? EMPTY_ARRAY;
  };

  isLoading = (): boolean => {
    return this.parentManager?.isLoading() || this._isLoading;
  };

  getError = (): Error | undefined => {
    return this.parentManager?.getError() ?? this._error;
  };

  getAtAddress = (address: number[]): RouteLitComponent[] => {
    const component = address.reduce(
      (acc, curr) =>
        Array.isArray(acc)
          ? acc[curr]
          : (acc as RouteLitComponent).children![curr],
      this.componentsTree as RouteLitComponent[] | RouteLitComponent
    );
    if (!component) throw new Error("Component not found");
    return Array.isArray(component) ? component : component.children!;
  };

  subscribe = (listener: Handler): (() => void) => {
    const unsubscribeParent = this.parentManager?.subscribe(listener);
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
      unsubscribeParent?.();
    };
  };

  subscribeIsLoading = (listener: IsLoadingHandler): (() => void) => {
    const unsubscribeParent = this.parentManager?.subscribeIsLoading(listener);
    this.isLoadingListeners.push(listener);
    return () => {
      this.isLoadingListeners = this.isLoadingListeners.filter(
        (l) => l !== listener
      );
      unsubscribeParent?.();
    };
  };

  subscribeError = (listener: ErrorHandler): (() => void) => {
    const unsubscribeParent = this.parentManager?.subscribeError(listener);
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter((l) => l !== listener);
      unsubscribeParent?.();
    };
  };

  private notifyListeners = () => {
    const componentsTree = this.getComponentsTree();
    for (const listener of this.listeners) {
      listener(componentsTree);
    }
  };

  private notifyIsLoading = () => {
    const isLoading = this.isLoading();
    for (const listener of this.isLoadingListeners) {
      listener(isLoading);
    }
  };

  private notifyError = () => {
    const error = this.getError();
    for (const listener of this.errorListeners) {
      listener(error!);
    }
  };
}
