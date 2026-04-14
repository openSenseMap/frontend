import  { type BaseInputTemplateProps } from "@rjsf/utils";

export function BaseInputTemplate(props: BaseInputTemplateProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    options,
    placeholder,
    type,
  } = props;

  return (
    <input
      id={id}
      type={type ?? "text"}
      value={value ?? ""}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => onBlur(id, value)}
      onFocus={() => onFocus(id, value)}
      className="
        w-full rounded-md border border-gray-300
        px-3 py-2 text-sm
        focus:outline-none focus:ring-2 focus:ring-green-500
        disabled:bg-gray-100 disabled:cursor-not-allowed
      "
    />
  );
}
