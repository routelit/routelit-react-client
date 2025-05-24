import { memo, useCallback } from "react";
import { useFormDispatcherWithAttr, useIsLoading } from "../core/context";

const Checkbox = memo(function Checkbox({
  label,
  checked,
  id,
  required,
  ...props
}: { label: string; checked: boolean; required?: boolean } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
>) {
  const dispatchChange = useFormDispatcherWithAttr(id!, "change", "checked");
  const isLoading = useIsLoading();
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatchChange(e.target.checked);
    },
    [dispatchChange]
  );
  return (
    <div className="rl-form-flex-control">
      <input
        {...props}
        disabled={isLoading || props.disabled}
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        required={required}
      />
      <label htmlFor={id}>
        {label} {required && <span className="rl-required">*</span>}
      </label>
    </div>
  );
});

Checkbox.displayName = "Checkbox";

export default Checkbox;
