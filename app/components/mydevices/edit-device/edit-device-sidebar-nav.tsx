import { useLocation } from "@remix-run/react";
import { Link } from "react-router-dom";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";


interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon: any
  }[]
}

export function EditDviceSidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = useLocation().pathname;
  console.log("🚀 ~ file: edit-sidebar-nav.tsx:16 ~ EditDviceSidebarNav ~ pathname:", pathname)

  return (
    <nav
      className={cn(
        "grid sm:flex sm:flex-row lg:flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 ",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "justify-start text-base"
          )}
        >
          <item.icon className=" mr-2 inline h-5 w-5 align-sub" />  {item.title}
        </Link>
      ))}
    </nav>
  )
}
