import { type WidgetProps } from "@rjsf/utils";

export function NumberWidget(props: WidgetProps) {
  return (
    <input
      id={props.id}
      type="number"
      value={props.value ?? ""}
      onChange={(e) => props.onChange(e.target.valueAsNumber || undefined)}
      disabled={props.disabled || props.readonly}
      min={props.schema.minimum}
      max={props.schema.maximum}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
    />
  );
}