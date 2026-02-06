import  { type FieldTemplateProps } from "@rjsf/utils";

export function FieldTemplate(props: FieldTemplateProps) {
  const {
    id,
    label,
    required,
    description,
    errors,
    children,
  } = props;

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-gray-800 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {description}

      {children}

      {errors && (
        <div className="mt-1 text-sm text-red-600">
          {errors}
        </div>
      )}
    </div>
  );
}
