import { Form, Link, useLocation } from "@remix-run/react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from "./ui/sheet";
import {
  ChevronDownIcon,
  Globe,
  LogOut,
  Mailbox,
  Plus,
  Puzzle,
  Settings,
  UserIcon,
} from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { useOptionalUser } from "~/utils";
import { UserAvatar } from "~/routes/resources.user-avatar";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const sidebarNavItems = [
  {
    title: "Your profile",
    href: "/profile/me",
    icon: <UserIcon size={24} />,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings size={24} />,
    separator: true,
  },
  {
    title: "Forum",
    href: "https://docs.sensebox.de/",
    icon: <Puzzle size={24} />,
  },
  {
    title: "API Docs",
    href: "https://docs.opensensemap.org/",
    icon: <Globe size={24} />,
    separator: true,
  },
];

export function NavBar() {
  const location = useLocation();
  const parts = location.pathname
    .split("/")
    .slice(1)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase());

  // To be able to close nested sheet component.
  const [sheetOpen, setSheetOpen] = useState(false);

  // User is optional
  // If no user render Login button
  const user = useOptionalUser();

  return (
    <div className="border-b dark:bg-dark-background dark:text-dark-text">
      <div className="flex h-16 items-center justify-between">
        <div className="flex max-w-screen-xl flex-wrap items-center justify-between">
          <Link to="/" className="flex items-center md:pr-4">
            <img src="/logo.png" className="mr-3 h-6 sm:h-9" alt="osem Logo" />
          </Link>
          <span className="dark:text-green-200 hidden self-center whitespace-nowrap text-xl font-semibold text-green-100 md:block">
            {parts.join(" / ")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* down arrow icon */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                    <ChevronDownIcon className=" m-0 inline h-4  w-4 p-0" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  forceMount
                  className="dark:bg-dark-background dark:text-dark-text"
                >
                  <DropdownMenuGroup>
                    <Link to="/device/new">
                      <DropdownMenuItem>
                        <span>New device</span>
                      </DropdownMenuItem>
                    </Link>

                    <Link to="/device/transfer">
                      <DropdownMenuItem>
                        <span>Transfer device</span>
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="icon" disabled>
                <Mailbox className="h-4 w-4" />
              </Button>
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <UserAvatar />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="dark:bg-dark-background dark:text-dark-text">
                  <SheetHeader>
                    <SheetDescription>
                      <div className="flex gap-4">
                        <UserAvatar />
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.name}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                    <>
                      <SidebarNav
                        items={sidebarNavItems}
                        setOpen={setSheetOpen}
                        className="dark:bg-dark-background dark:text-dark-text"
                      />
                      <Form action="/logout" method="post">
                        <button
                          type="submit"
                          className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text outline-none transition-colors pl-0 pt-0"
                        >
                          <LogOut className="mr-2 h-5 w-5" />
                          <span className="text-red-500 hover:bg-transparent hover:underline">
                            Sign out
                          </span>
                        </button>
                      </Form>
                    </>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
