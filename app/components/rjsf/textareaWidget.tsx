import { type WidgetProps } from "@rjsf/utils";

export function TextareaWidget(props: WidgetProps) {
  return (
    <textarea
      id={props.id}
      value={props.value ?? ""}
      onChange={(e) => props.onChange(e.target.value)}
      rows={4}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
    />
  );
}