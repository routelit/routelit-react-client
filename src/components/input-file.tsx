import { useInputFileChangeEvent } from "../core/hooks";

function InputFileComponent({
  id,
  label,
  required,
  ...props
}: {
  label?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const handleChange = useInputFileChangeEvent(id!);
  return (
    <div className="rl-form-group">
      {label && (
        <label htmlFor={id}>
          {label} {required && <span className="rl-required">*</span>}
        </label>
      )}
      <input
        type="file"
        id={id}
        {...props}
        onChange={handleChange}
      />
    </div>
  );
}

export default InputFileComponent;
