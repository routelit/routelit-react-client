import { memo, useRef } from "react";
import { useFormDispatcherWithAttr } from "../core/context";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  id: string;
  value?: string;
  options: Array<{ label: string; value: string; disabled?: boolean } | string>;
}

function SelectOption(props: { option: SelectProps["options"][number] }) {
  const option: SelectProps["options"][number] =
    typeof props.option === "string"
      ? { label: props.option, value: props.option }
      : props.option;

  return (
    <option value={option.value} disabled={option.disabled}>
      {option.label}
    </option>
  );
}

const Select = memo(function Select({
  id,
  label,
  required,
  value,
  options,
  children: _,
  ...props
}: SelectProps) {
  const dispatchChange = useFormDispatcherWithAttr(id, "change", "value");
  const lastValueRef = useRef(value);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = e.target.value;
    if (newValue !== lastValueRef.current) {
      lastValueRef.current = newValue;
      dispatchChange(newValue);
    }
  }

  return (
    <div className="rl-form-group">
      {label && (
        <label htmlFor={id}>
          {label} {required && <span className="rl-required">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        {...props}
        required={required}
        onChange={handleChange}
      >
        {options.map((option) => (
          <SelectOption
            key={typeof option === "string" ? option : option.value}
            option={option}
          />
        ))}
      </select>
    </div>
  );
});

Select.displayName = "Select";

export default Select;
