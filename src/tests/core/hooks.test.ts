import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useInputChangeEvent, EVENT_VALUE_GETTER } from "../../core/hooks";
import * as context from "../../core/context";

type MockFn = {
  mockReturnValue: (value: unknown) => void;
};

vi.mock("../../core/context", () => ({
  useFormDispatcherWithAttr: vi.fn(),
}));

describe("Hooks", () => {
  describe("useInputChangeEvent", () => {
    const mockDispatch = vi.fn();
    const initialValue = "initial";

    beforeEach(() => {
      vi.clearAllMocks();
      ((context.useFormDispatcherWithAttr as unknown) as MockFn).mockReturnValue(mockDispatch);
    });

    it("dispatches value on blur when value changes", () => {
      const { result } = renderHook(() => useInputChangeEvent("test", initialValue));
      
      result.current.handleBlur({
        currentTarget: { value: "new value" },
      } as React.FocusEvent<HTMLInputElement>);

      expect(mockDispatch).toHaveBeenCalledWith("new value");
    });

    it("does not dispatch on blur when value is unchanged", () => {
      const { result } = renderHook(() => useInputChangeEvent("test", initialValue));
      
      result.current.handleBlur({
        currentTarget: { value: initialValue },
      } as React.FocusEvent<HTMLInputElement>);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("dispatches value on Enter key when value changes", () => {
      const { result } = renderHook(() => useInputChangeEvent("test", initialValue));
      
      result.current.handleKeyDown({
        key: "Enter",
        currentTarget: { value: "new value" },
      } as React.KeyboardEvent<HTMLInputElement>);

      expect(mockDispatch).toHaveBeenCalledWith("new value");
    });

    it("does not dispatch on Enter key when value is unchanged", () => {
      const { result } = renderHook(() => useInputChangeEvent("test", initialValue));
      
      result.current.handleKeyDown({
        key: "Enter",
        currentTarget: { value: initialValue },
      } as React.KeyboardEvent<HTMLInputElement>);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("does not dispatch on non-Enter key press", () => {
      const { result } = renderHook(() => useInputChangeEvent("test", initialValue));
      
      result.current.handleKeyDown({
        key: "a",
        currentTarget: { value: "new value" },
      } as React.KeyboardEvent<HTMLInputElement>);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("uses custom value getter when provided", () => {
      const customGetter = (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement> | React.ChangeEvent<HTMLInputElement>) => 
        e.currentTarget.value.toUpperCase();
      const { result } = renderHook(() => 
        useInputChangeEvent("test", initialValue, customGetter)
      );
      
      result.current.handleBlur({
        currentTarget: { value: "new value" },
      } as React.FocusEvent<HTMLInputElement>);

      expect(mockDispatch).toHaveBeenCalledWith("NEW VALUE");
    });
  });

  describe("EVENT_VALUE_GETTER", () => {
    it("returns the current target value", () => {
      const event = {
        currentTarget: { value: "test value" },
      } as React.ChangeEvent<HTMLInputElement>;

      expect(EVENT_VALUE_GETTER(event)).toBe("test value");
    });
  });
}); 