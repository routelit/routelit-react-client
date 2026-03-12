import React from "react";

import initManager from "./core/initializer";
import { ComponentStore } from "./core/component-store";
import Fragment from "./components/fragment";
import Link from "./components/link";
import Form from "./components/form";
import Head from "./components/head";
import {
  useDispatcherWith,
  useDispatcherWithAttr,
  useFormDispatcherWithAttr,
  useFormDispatcher,
  useIsLoading,
  useError,
} from "./core/context";
import { RouteLitManager } from "./core/manager";
import { renderApp } from "./app-factory";
import {
  withEventDispatcher,
  withValueEventDispatcher,
  withSimpleComponent,
  withInputValueEventDispatcher,
  withCallbackAttributes,
} from "./core/hoc";
import {
  useLinkClickHandler,
  useRLInlineElement,
  useRLCallbackAttributes,
} from "./core/hooks";

// Define the type for our client interface
export interface RoutelitClientType {
  manager: RouteLitManager;
  componentStore: ComponentStore;
  useDispatcherWith: typeof useDispatcherWith;
  useDispatcherWithAttr: typeof useDispatcherWithAttr;
  useFormDispatcherWithAttr: typeof useFormDispatcherWithAttr;
  useFormDispatcher: typeof useFormDispatcher;
  useIsLoading: typeof useIsLoading;
  useError: typeof useError;
  renderApp: (rootId?: string) => void;
  withEventDispatcher: typeof withEventDispatcher;
  withValueEventDispatcher: typeof withValueEventDispatcher;
  withSimpleComponent: typeof withSimpleComponent;
  withInputValueEventDispatcher: typeof withInputValueEventDispatcher;
  useLinkClickHandler: typeof useLinkClickHandler;
  useRLInlineElement: typeof useRLInlineElement;
  useRLCallbackAttributes: typeof useRLCallbackAttributes;
  withCallbackAttributes: typeof withCallbackAttributes;
}

// Check if we already have an instance in the window object
// This ensures we only ever have a single instance of these objects
let manager: RouteLitManager;
let componentStore: ComponentStore;

// Add this to the window type
declare global {
  interface Window {
    RoutelitClient?: RoutelitClientType;
    componentStore?: ComponentStore;
  }
}

// Only create new instances if they don't already exist in the window
if (window.RoutelitClient) {
  manager = window.RoutelitClient.manager;
  componentStore = window.RoutelitClient.componentStore;
} else {
  manager = initManager();
  componentStore = new ComponentStore();
}

// Import components - hybrid approach:
// - Eager load components that need React Context (Dialog, Form, Input, etc.)
// - Lazy load heavy components like Markdown
import Dialog from "./components/dialog";
import Container from "./components/container";
import Expander from "./components/expander";
import Flex from "./components/flex";
import Input from "./components/input";
import Radio from "./components/radio";
import Select from "./components/select";
import Textarea from "./components/textarea";
import Checkbox from "./components/checkbox";
import CheckboxGroup from "./components/checkbox-group";
import InputFile from "./components/input-file";

// Lazy load only heavy components that don't need context
const Markdown = React.lazy(() => import("./components/markdown"));

// Register components
componentStore.register(
  "root",
  withSimpleComponent("div", { className: "rl-container" }),
);
componentStore.register("fragment", Fragment);
componentStore.register("link", Link);
componentStore.register("dialog", Dialog);
componentStore.register("form", Form);
componentStore.register("head", Head);
componentStore.register("container", Container);
componentStore.register("markdown", Markdown);
componentStore.register("image", withSimpleComponent("img"));
componentStore.register("hr", withSimpleComponent("hr"));
componentStore.register(
  "button",
  withEventDispatcher("button", { type: "button" }),
);
componentStore.register("expander", Expander);
componentStore.register("title", withSimpleComponent("h1"));
componentStore.register("header", withSimpleComponent("h2"));
componentStore.register("subheader", withSimpleComponent("h3"));
componentStore.register("flex", Flex);
componentStore.register("text-input", Input);
componentStore.register(
  "single-text-input",
  withInputValueEventDispatcher("input"),
);
componentStore.register("radio", Radio);
componentStore.register("select", Select);
componentStore.register("textarea", Textarea);
componentStore.register(
  "single-textarea",
  withInputValueEventDispatcher("textarea"),
);
componentStore.register("checkbox", Checkbox);
componentStore.register(
  "single-checkbox",
  withValueEventDispatcher("input", {
    type: "checkbox",
    rlValueAttr: "checked",
    rlEventValueGetter: (e: React.ChangeEvent<HTMLInputElement>) =>
      e.currentTarget.checked,
  }),
);
componentStore.register("checkbox-group", CheckboxGroup);
componentStore.register("input-file", InputFile);
componentStore.forceUpdate();

export {
  useDispatcherWith,
  manager,
  componentStore,
  useDispatcherWithAttr,
  useIsLoading,
  useError,
  useFormDispatcherWithAttr,
  useFormDispatcher,
  renderApp,
  withEventDispatcher,
  withValueEventDispatcher,
  withSimpleComponent,
  withInputValueEventDispatcher,
  useLinkClickHandler,
  useRLInlineElement,
  useRLCallbackAttributes,
  withCallbackAttributes,
};

const RoutelitClient: RoutelitClientType = {
  manager,
  componentStore,
  useDispatcherWith,
  useDispatcherWithAttr,
  useIsLoading,
  useError,
  useFormDispatcherWithAttr,
  useFormDispatcher,
  renderApp,
  withEventDispatcher,
  withValueEventDispatcher,
  withSimpleComponent,
  withInputValueEventDispatcher,
  useLinkClickHandler,
  useRLInlineElement,
  useRLCallbackAttributes,
  withCallbackAttributes,
};

// Expose them globally
window.RoutelitClient = RoutelitClient;

export { RoutelitClient };
