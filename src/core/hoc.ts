import {
  createElement,
  useCallback,
  PropsWithChildren,
  ComponentProps,
} from "react";
import { useFormDispatcher, useFormDispatcherWithAttr } from "./context";
import { useInputChangeEvent, EVENT_VALUE_GETTER } from "./hooks";

export function withSimpleComponent<T extends React.ElementType>(
  Component: T,
  initialProps?:
    | { [key in keyof ComponentProps<T>]: ComponentProps<T>[key] }
    | undefined
) {
  return function WithSimpleComponent({
    children,
    ...props
  }: PropsWithChildren<{ id: string }> & ComponentProps<T>) {
    const finalProps = initialProps ? { ...initialProps, ...props } : props;
    return createElement(Component, finalProps, children);
  };
}

type WithEventNameProps = PropsWithChildren<{
  rlEventName: string;
  rlEventAttr: string;
  id: string;
}>;

const DEFAULT_EVENT_DISPATCHER_PROPS: Omit<WithEventNameProps, "id"> = {
  rlEventName: "click",
  rlEventAttr: "onClick",
};

/**
 * HOC to dispatch an event when the component is clicked.
 * @param Component - The component to wrap.
 * @param options - The options to pass to the component.
 * @returns A wrapped component that dispatches a click event when the component is clicked.
 * @example
 * const Button = withEventDispatcher("button", {
 *   rlEventName: "click", // optional, default is "click"
 *   rlEventAttr: "onClick", // optional, default is "onClick"
 * });
 */
export function withEventDispatcher<T extends React.ElementType>(
  Component: T,
  options?: Partial<typeof DEFAULT_EVENT_DISPATCHER_PROPS> & {
    [key in keyof ComponentProps<T>]: ComponentProps<T>[key];
  }
) {
  const {
    rlEventName: upperRlEventName,
    rlEventAttr: upperRlEventAttr,
    ...initialProps
  } = { ...DEFAULT_EVENT_DISPATCHER_PROPS, ...options };
  return function WithEventDispatcher({
    children,
    rlEventName = upperRlEventName,
    rlEventAttr = upperRlEventAttr,
    ...props
  }: WithEventNameProps) {
    const dispatch = useFormDispatcher(props.id, rlEventName);
    const onEvent = useCallback(() => {
      dispatch({});
    }, [dispatch]);
    return createElement(
      Component,
      { ...initialProps, ...props, [rlEventAttr]: onEvent },
      children
    );
  };
}

type ValueHocProps = PropsWithChildren<{
  rlEventName: string;
  rlEventAttr: string;
  rlValueAttr: string;
  id: string;
  rlEventValueGetter(ev: unknown): unknown;
}>;

const DEFAULT_VALUE_EVENT_DISPATCHER_PROPS: Omit<ValueHocProps, "id"> = {
  rlEventName: "change",
  rlEventAttr: "onChange",
  rlValueAttr: "value",
  rlEventValueGetter: EVENT_VALUE_GETTER as ValueHocProps["rlEventValueGetter"],
};

/**
 * HOC to dispatch a change event when the component is changed.
 * @param Component - The component to wrap.
 * @param options - The options to pass to the component.
 * @returns A wrapped component that dispatches a change event when the component is changed.
 * @example
 * const TextInput = withValueEventDispatcher("input", {
 *   rlEventName: "change", // optional, default is "change"
 *   rlEventAttr: "onChange", // optional, default is "onChange"
 *   rlValueAttr: "value", // optional, default is "value"
 *   rlEventValueGetter: (e) => e.target.value, // optional, default is EVENT_VALUE_GETTER
 *   type: "text",
 * });
 * const Checkbox = withValueEventDispatcher("input", {
 *   rlEventName: "change",
 *   rlEventAttr: "onChange",
 *   rlValueAttr: "checked",
 *   rlEventValueGetter: (e) => e.target.checked,
 *   type: "checkbox",
 * });
 */
export function withValueEventDispatcher<T extends React.ElementType>(
  Component: T,
  options?: Partial<typeof DEFAULT_VALUE_EVENT_DISPATCHER_PROPS> & {
    [key in keyof ComponentProps<T>]: ComponentProps<T>[key];
  }
) {
  const {
    rlEventName: upperRlEventName,
    rlEventAttr: upperRlEventAttr,
    rlValueAttr: upperRlValueAttr,
    rlEventValueGetter,
    ...initialProps
  } = { ...DEFAULT_VALUE_EVENT_DISPATCHER_PROPS, ...options };
  return function WithValueEventDispatcher({
    children,
    rlEventName = upperRlEventName,
    rlEventAttr = upperRlEventAttr,
    rlValueAttr = upperRlValueAttr,
    ...props
  }: Omit<ValueHocProps, "rlEventValueGetter">) {
    const dispatchChange = useFormDispatcherWithAttr(
      props.id,
      rlEventName,
      rlValueAttr
    );
    const onChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatchChange(rlEventValueGetter(e));
      },
      [dispatchChange]
    );
    return createElement(
      Component,
      { ...initialProps, ...props, [rlEventAttr]: onChange },
      children
    );
  };
}

export type WithInputValueEventDispatcherProps = PropsWithChildren<{
  rlOnBlurAttr: string;
  rlOnKeyDownAttr: string;
  rlValueAttr: string;
  rlEventValueGetter: (e: unknown) => unknown;
  id: string;
}>;

const DEFAULT_INPUT_VALUE_EVENT_DISPATCHER_PROPS: Pick<
  WithInputValueEventDispatcherProps,
  "rlOnBlurAttr" | "rlOnKeyDownAttr" | "rlEventValueGetter" | "rlValueAttr"
> = {
  rlOnBlurAttr: "onBlur",
  rlOnKeyDownAttr: "onKeyDown",
  rlValueAttr: "defaultValue",
  rlEventValueGetter:
    EVENT_VALUE_GETTER as WithInputValueEventDispatcherProps["rlEventValueGetter"],
};

/**
 * HOC to dispatch a change event when the component is changed.
 *  This already uses the following defaults when sending the event to backend:
 * - rlEventName: "change"
 * - rlValueAttr: "value"
 * @param Component - The component to wrap.
 * @param options - The options to pass to the component.
 * @returns A wrapped component that dispatches a change event when the component is changed.
 * @example
 * const TextInput = withInputValueEventDispatcher("input", {
 *   rlOnBlurAttr: "onBlur", // optional, default is "onBlur"
 *   rlOnKeyDownAttr: "onKeyDown", // optional, default is "onKeyDown"
 *   rlEventValueGetter: (e) => e.target.value, // optional, default is EVENT_VALUE_GETTER
 * });
 */
export function withInputValueEventDispatcher<T extends React.ElementType>(
  Component: T,
  options?: Partial<typeof DEFAULT_INPUT_VALUE_EVENT_DISPATCHER_PROPS> & {
    [key in keyof ComponentProps<T>]: ComponentProps<T>[key];
  }
) {
  const {
    rlOnBlurAttr: upperRlOnBlurAttr,
    rlOnKeyDownAttr: upperRlOnKeyDownAttr,
    rlValueAttr: upperRlValueAttr,
    rlEventValueGetter,
    ...initialProps
  } = { ...DEFAULT_INPUT_VALUE_EVENT_DISPATCHER_PROPS, ...options };
  return function WithInputValueEventDispatcher({
    children,
    rlOnBlurAttr = upperRlOnBlurAttr,
    rlOnKeyDownAttr = upperRlOnKeyDownAttr,
    rlValueAttr = upperRlValueAttr,
    ...props
  }: WithInputValueEventDispatcherProps) {
    const { handleBlur, handleKeyDown } = useInputChangeEvent(
      props.id,
      props[rlValueAttr as keyof typeof props] as string,
      rlEventValueGetter as typeof EVENT_VALUE_GETTER
    );
    return createElement(
      Component,
      {
        ...initialProps,
        ...props,
        [rlOnBlurAttr]: handleBlur,
        [rlOnKeyDownAttr]: handleKeyDown,
      },
      children
    );
  };
}
