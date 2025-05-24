import { memo, useCallback } from "react";
import { useFormDispatcherWithAttr, useIsLoading } from "../core/context";

type RadioGroupProps = {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  flexDirection?: "row" | "col";
  options: Array<
    | {
        label: string;
        value: string;
        caption?: string;
        disabled?: boolean;
      }
    | string
  >;
};

function RadioGroupOption(props: {
  option: RadioGroupProps["options"][number];
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}) {
  const { id, value, onChange, isLoading } = props;

  const option: RadioGroupProps["options"][number] =
    typeof props.option === "string"
      ? { label: props.option, value: props.option }
      : props.option;

  return (
    <div className="rl-form-flex-control">
      <input
        disabled={isLoading || option.disabled}
        type="radio"
        value={option.value}
        id={`${id}-${option.value}`}
        checked={value === option.value}
        onChange={onChange}
      />
      <div className="rl-form-inline-label">
        <label htmlFor={`${id}-${option.value}`}>{option.label}</label>
        {option.caption && (
          <small className="rl-form-control-caption">{option.caption}</small>
        )}
      </div>
    </div>
  );
}

const RadioGroup = memo(function RadioGroup({
  id,
  label,
  value,
  required,
  options,
  flexDirection = "col",
}: RadioGroupProps) {
  const dispatchChange = useFormDispatcherWithAttr(id, "change", "value");
  const isLoading = useIsLoading();
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatchChange(e.target.value);
    },
    [dispatchChange]
  );
  return (
    <>
      {label && (
        <label>
          {label} {required && <span className="rl-required">*</span>}
        </label>
      )}
      <div className={`rl-form-control-group rl-flex-${flexDirection}`}>
        {options.map((option) => (
          <RadioGroupOption
            key={typeof option === "string" ? option : option.value}
            id={id}
            value={value}
            onChange={onChange}
            isLoading={isLoading}
            option={option}
          />
        ))}
      </div>
    </>
  );
});

RadioGroup.displayName = "RadioGroup";

export default RadioGroup;
