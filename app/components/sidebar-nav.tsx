"use client";

import { NavLink } from "@remix-run/react";
import { cn } from "~/lib/utils";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon?: any;
    separator?: boolean
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
        <>
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
          <div className="flex my-1">
            {item.icon && item.icon}
            {item.title}
          </div>
        </NavLink>
        {item?.separator && (
          <hr className="my-4 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />
        )}
        </>
      ))}
    </nav>
  );
}
