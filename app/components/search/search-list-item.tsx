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
  "relative my-1 flex gap-2 h-8 px-2 items-center rounded-lg data-[active=true]:bg-green-100 data-[active=true]:text-white",
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
        <div className="w-6">
          <kbd>{index + 1}</kbd>
        </div>
      )}
      <div className="h-8 w-8 p-1">
        <Icon className="h-full" />
      </div>
      <span className="inline-block overflow-hidden overflow-ellipsis whitespace-nowrap align-middle">
        {name}
      </span>
    </div>
  );
}
