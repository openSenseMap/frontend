import { type FieldTemplateProps } from "@rjsf/utils";

export function FieldTemplate(props: FieldTemplateProps) {
  const {
    id,
    classNames,
    style,
    label,
    required,
    errors,
    children,
  } = props;

  return (
    <div className={classNames} style={style}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {children}
      
      {errors && (
        <div className="mt-1 text-sm text-red-600">
          {errors}
        </div>
      )}
    </div>
  );
}