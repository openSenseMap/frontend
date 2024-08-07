import { useInputEvent } from "@conform-to/react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { useId, useRef } from "react";

export function CheckboxField({
  labelProps,
  buttonProps,
}: // errors,
{
  labelProps: Omit<JSX.IntrinsicElements["label"], "className">;
  buttonProps: Omit<
    React.ComponentPropsWithoutRef<typeof Checkbox.Root>,
    "type" | "className"
  > & {
    type?: string;
  };
  // errors?: ListOfErrors;
}) {
  const fallbackId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  // To emulate native events that Conform listen to:
  // See https://conform.guide/integrations
  const control = useInputEvent({
    // Retrieve the checkbox element by name instead as Radix does not expose the internal checkbox element
    // See https://github.com/radix-ui/primitives/discussions/874
    ref: () =>
      buttonRef.current?.form?.elements.namedItem(buttonProps.name ?? ""),
    onFocus: () => buttonRef.current?.focus(),
  });
  const id = buttonProps.id ?? buttonProps.name ?? fallbackId;
  // const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div>
      <div className="flex gap-2">
        <Checkbox.Root
          id={id}
          ref={buttonRef}
          className="flex h-6 w-6 items-center justify-center rounded border"
          // aria-invalid={errorId ? true : undefined}
          // aria-describedby={errorId}
          {...buttonProps}
          onCheckedChange={(state) => {
            control.change(Boolean(state.valueOf()));
            buttonProps.onCheckedChange?.(state);
          }}
          onFocus={(event) => {
            control.focus();
            buttonProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            control.blur();
            buttonProps.onBlur?.(event);
          }}
          type="button"
        >
          <Checkbox.Indicator className="h-4 w-4">
            <svg viewBox="0 0 8 8">
              <path
                d="M1,4 L3,6 L7,2"
                stroke="black"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label
          htmlFor={id}
          {...labelProps}
          className="text-body-xs text-night-200 self-center"
        />
      </div>
      {/* <div className="px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div> */}
    </div>
  );
}
