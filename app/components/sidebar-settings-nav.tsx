"use client";

import { NavLink } from "react-router";
import { cn } from "~/lib/utils";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
  }[];
}

export function SidebarSettingsNav({
  className,
  items,
  ...props
}: SidebarNavProps) {
  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive, isPending }) =>
            isPending
              ? ""
              : isActive
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline"
          }
        >
          <div className="flex my-1">{item.title}</div>
        </NavLink>
      ))}
    </nav>
  );
}
