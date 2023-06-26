import { Link, useLocation } from "@remix-run/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from "./ui/sheet";
import { Cog, Mailbox, Plus, User } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";

const sidebarNavItems = [
  {
    title: "Your profile",
    href: "/profile/me",
    icon: <User size={24} />,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Cog size={24} />,
  },
];

export function NavBar() {
  const location = useLocation();

  // TODO: use fetcher to get autheticated user

  return (
    <div className="border-b">
      <div className="flex h-16 items-center justify-between">
        <div className="flex max-w-screen-xl flex-wrap items-center justify-between">
          <Link to="/" className="flex items-center md:pr-4">
            <img src="/logo.png" className="mr-3 h-6 sm:h-9" alt="osem Logo" />
          </Link>
          <span className="dark:text-green-200 hidden self-center whitespace-nowrap text-xl font-semibold text-green-100 md:block">
            {location.pathname.slice(1).charAt(0).toUpperCase() +
              location.pathname.slice(2)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Mailbox className="h-4 w-4" />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt="maxm" />
                  <AvatarFallback>MM</AvatarFallback>
                </Avatar>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetDescription>
                  <div className="flex gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/01.png" alt="maxm" />
                      <AvatarFallback>MM</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">maxm</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        max@mustermann.de
                      </p>
                    </div>
                  </div>
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <SheetClose asChild>
                  <SidebarNav items={sidebarNavItems} />
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
