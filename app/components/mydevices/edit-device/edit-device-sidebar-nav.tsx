import { useLocation, Link} from "react-router";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: any;
  }[];
}

export function EditDviceSidebarNav({
  className,
  items,
  ...props
}: SidebarNavProps) {
  const pathname = useLocation().pathname;
  return (
    <nav
      className={cn(
        "grid space-x-2 sm:flex sm:flex-row lg:flex lg:flex-col lg:space-x-0 lg:space-y-1 ",
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
          <item.icon className=" mr-2 inline h-5 w-5 align-sub" /> {item.title}
        </Link>
      ))}
    </nav>
  );
}
