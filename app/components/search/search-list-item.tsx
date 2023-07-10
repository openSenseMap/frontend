import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { HTMLProps } from "react";

export type HeroIcon = React.ComponentType<
  React.PropsWithoutRef<React.ComponentProps<"svg">> & {
    title?: string | undefined;
    titleId?: string | undefined;
  }
>;

interface SearchListItemProps
  extends VariantProps<typeof searchListItemStyle>,
    HTMLProps<HTMLDivElement> {
  index: number;
  controlPress: boolean;
  icon: HeroIcon;
  name: string;
}

const searchListItemStyle = cva(
  "relative my-1 flex h-8 items-center rounded-lg data-[active=true]:bg-green-100 data-[active=true]:text-white",
  {
    variants: {
      active: {
        true: "bg-green-100 text-white",
      },
    },
  }
);

export default function SearchListItem({
  active,
  index,
  controlPress,
  icon,
  name,
  ...props
}: SearchListItemProps) {
  const Icon = icon;

  return (
    <div className={searchListItemStyle({ active })} {...props}>
      {controlPress && (
        <div className="w-6 pl-2">
          <kbd>{index + 1}</kbd>
        </div>
      )}
      <Icon className="h-8 w-8 pl-2" />
      <span className="inline-block pl-2 align-middle">{name}</span>
    </div>
  );
}
