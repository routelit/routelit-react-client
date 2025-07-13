import { memo, useRef } from "react";
import { useFormDispatcherWithAttr } from "../core/context";

function TextInputComponent({
  id,
  label,
  value,
  type = "text",
  children: _,
  ...props
}: {
  id: string;
  label?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const dispatchChange = useFormDispatcherWithAttr(id, "change", "value");
  const lastValueRef = useRef(value);

  function handleChange(newValue: string) {
    if (newValue !== lastValueRef.current) {
      dispatchChange(newValue);
      lastValueRef.current = newValue;
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    handleChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleChange((e.target as HTMLInputElement).value);
    }
  };
  const required = props.required;

  return (
    <div className="rl-form-group">
      {label && <label htmlFor={id}>{label} {required && <span className="rl-required">*</span>}</label>}
      <input
        type={type}
        id={id}
        {...props}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        defaultValue={value}
      />
    </div>
  );
}

const TextInput = memo(TextInputComponent);
TextInput.displayName = "TextInput";

export default TextInput;
