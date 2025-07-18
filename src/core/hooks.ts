import { useRef } from "react";
import { useFormDispatcherWithAttr } from "./context";

type InputEventTarget =
  | HTMLInputElement
  | HTMLTextAreaElement
  | { value: string };

type InputHookResult<T extends InputEventTarget> = {
  handleBlur: (e: React.FocusEvent<T>) => void;
  handleKeyDown: (e: React.KeyboardEvent<T>) => void;
};

export const EVENT_VALUE_GETTER = (
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement> | React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement> | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => e.currentTarget.value;

export function useInputChangeEvent<
  T extends HTMLInputElement | HTMLTextAreaElement
>(
  id: string,
  value: string,
  valueGetter: (
    e: React.FocusEvent<T> | React.KeyboardEvent<T> | React.ChangeEvent<T>
  ) => string = EVENT_VALUE_GETTER
): InputHookResult<T> {
  const dispatchChange = useFormDispatcherWithAttr(id, "change", "value");
  const lastValueRef = useRef(value);

  function handleChange(newValue: string) {
    if (newValue !== lastValueRef.current) {
      lastValueRef.current = newValue;
      dispatchChange(newValue);
    }
  }

  const handleBlur = (e: React.FocusEvent<T>) => {
    handleChange(valueGetter(e));
  };

  const handleKeyDown = (e: React.KeyboardEvent<T>) => {
    if (e.key === "Enter") {
      handleChange(valueGetter(e));
    }
  };

  return { handleBlur, handleKeyDown };
}
