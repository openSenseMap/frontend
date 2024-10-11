import { Form, Link, useNavigation, useSearchParams } from "@remix-run/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "~/components/spinner";
import {
  Globe,
  LogIn,
  LogOut,
  Puzzle,
  Menu as MenuIcon,
  FileLock2,
  Coins,
  User2,
  ExternalLink,
  Settings,
} from "lucide-react";
import { useOptionalUser } from "~/utils";

export default function Menu() {
  const [searchParams] = useSearchParams();
  const redirectTo =
    searchParams.size > 0 ? "/explore?" + searchParams.toString() : "/explore";
  const [open, setOpen] = useState(false);
  const navigation = useNavigation();
  const isLoggingOut = Boolean(navigation.state === "submitting");
  const user = useOptionalUser();

  const { t } = useTranslation("menu");

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <div className="pointer-events-auto box-border h-10 w-10">
          <button
            type="button"
            className="h-10 w-10 rounded-full border border-gray-100 bg-white text-center text-black hover:bg-gray-100"
          >
            {!user ? (
              <MenuIcon className="mx-auto h-6 w-6" />
            ) : (
              <User2 className="mx-auto h-6 w-6" />
            )}
          </button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95"
        align="end"
        forceMount
      >
        <div
          className={
            navigation.state === "loading" ? "pointer-events-none" : ""
          }
        >
          <DropdownMenuLabel className="font-normal">
            {!user ? (
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{t("title")}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {t("subtitle")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">
                  {/* Max Mustermann */}
                  {user?.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user && (
            <DropdownMenuGroup>
              {navigation.state === "loading" && (
                <div className="bg-white/30 dark:bg-zinc-800/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                  <Spinner />
                </div>
              )}
              <Link to="/profile/me">
                <DropdownMenuItem className="cursor-pointer">
                  <User2 className="mr-2 h-6 w-6" />
                  Profile
                </DropdownMenuItem>
              </Link>

              <Link to="/settings">
                <DropdownMenuItem className=" cursor-pointer">
                  <Settings className="mr-2 h-5 w-5" />
                  <span>{"Settings"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </Link>
            </DropdownMenuGroup>
          )}
          <DropdownMenuGroup>
            <Link to="https://docs.sensebox.de/" target="_blank">
              <DropdownMenuItem className="cursor-pointer">
                <Puzzle className="mr-2 h-5 w-5" />
                <span>{t("tutorials_label")}</span>
                <ExternalLink className="ml-auto h-4 w-4 text-gray-300" />
              </DropdownMenuItem>
            </Link>

            <Link to="https://docs.opensensemap.org/" target="_blank">
              <DropdownMenuItem className="cursor-pointer">
                <Globe className="mr-2 h-5 w-5" />
                <span>{t("api_docs_label")}</span>
                <ExternalLink className="ml-auto h-4 w-4 text-gray-300" />
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link to={"/privacy"}>
              <DropdownMenuItem className="cursor-pointer">
                <FileLock2 className="mr-2 h-5 w-5" />
                <span>{t("data_protection_label")}</span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <Link
              to={
                "https://www.betterplace.org/de/projects/89947-opensensemap-org-die-freie-karte-fuer-umweltdaten"
              }
              target="_blank"
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer"
              >
                <Coins className="mr-2 inline h-5 w-5" />
                <span> {t("donate_label")}</span>
                <ExternalLink className="ml-auto h-4 w-4 text-gray-300" />
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem>
              {!user ? (
                <Link
                  to={{
                    pathname: "login",
                    search: searchParams.toString(),
                  }}
                  onClick={() => setOpen(false)}
                  className="cursor-pointer w-full"
                >
                  <button className="relative flex w-full select-none items-center rounded-sm text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground">
                    <LogIn className="mr-2 h-5 w-5" />
                    <span className="text-light-green">{t("login_label")}</span>
                  </button>
                </Link>
              ) : (
                <Form
                  action="/logout"
                  method="post"
                  onSubmit={() => {
                    setOpen(false);
                    // toast({
                    //   description: "Logging out ...",
                    // });
                  }}
                  className="cursor-pointer w-full"
                >
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <button
                    type="submit"
                    className="relative flex w-full select-none items-center rounded-sm text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground"
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    <span className="text-red-500">{t("logout_label")}</span>
                  </button>
                </Form>
              )}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
