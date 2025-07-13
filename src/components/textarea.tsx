import { memo, useRef } from "react";
import { useFormDispatcherWithAttr } from "../core/context";

function TextareaComponent({
  id,
  label,
  value,
  ...props
}: {
  id: string;
  label?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const dispatchChange = useFormDispatcherWithAttr(id, "change", "value");
  const lastValueRef = useRef(value);

  function handleChange(newValue: string) {
    if (newValue !== lastValueRef.current) {
      dispatchChange(newValue);
      lastValueRef.current = newValue;
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    handleChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      handleChange((e.target as HTMLTextAreaElement).value);
    }
  };
  const required = props.required;

  return (
    <div className="rl-form-group">
      {label && <label htmlFor={id}>{label} {required && <span className="rl-required">*</span>}</label>}
      <textarea
        id={id}
        {...props}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        defaultValue={value}
      />
    </div>
  );
}

const Textarea = memo(TextareaComponent);
Textarea.displayName = "Textarea";

export default Textarea;
