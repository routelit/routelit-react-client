import { memo, useCallback } from "react";
import { useFormDispatcher, useIsLoading } from "../core/context";

const Button = memo(function Button({
  text,
  id,
  eventName = "click",
  ...props
}: {
  text: string;
  id: string;
  eventName?: string;
} & React.HTMLAttributes<HTMLButtonElement>) {
  const dispatch = useFormDispatcher(id, eventName);
  const isLoading = useIsLoading();
  const handleClick = useCallback(() => {
    dispatch({});
  }, [dispatch]);
  return (
    <button
      id={id}
      type="button"
      disabled={isLoading}
      {...props}
      onClick={handleClick}
    >
      {text}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
