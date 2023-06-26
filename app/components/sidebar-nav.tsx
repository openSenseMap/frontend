"use client";

import { NavLink } from "@remix-run/react";
import { cn } from "~/lib/utils";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
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
          {item.title}
        </NavLink>
      ))}
    </nav>
  );
}
