import { Link, useLocation } from "@remix-run/react";
import { Button } from "./ui/button";

import { ChevronDownIcon, Mailbox, Plus, Settings } from "lucide-react";
import { useOptionalUser } from "~/utils";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Menu from "./header/menu";

export function NavBar() {
  const location = useLocation();
  const parts = location.pathname
    .split("/")
    .slice(1)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase());

  // User is optional
  // If no user render Login button
  const user = useOptionalUser();

  return (
    <div className="border-b bg-white dark:bg-dark-background dark:text-dark-text p-4">
      <div className="flex h-16 items-center justify-between">
        <div className="flex max-w-screen-xl flex-wrap items-center justify-between">
          <Link to="/" className="flex items-center md:pr-4">
            <img src="/logo.png" className="mr-3 h-6 sm:h-9" alt="osem Logo" />
          </Link>
          <span className="dark:text-dark-green hidden self-center whitespace-nowrap text-xl font-semibold text-light-green md:block">
            {parts.join(" / ")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" disabled>
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

              <Button variant={"ghost"} size={"icon"}>
                <Link to={"/settings"}>
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>

              <div className="px-8">
                <Menu />
              </div>
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
