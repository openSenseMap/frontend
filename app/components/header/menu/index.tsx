import {
  Form,
  Link,
  useNavigation,
  useSearchParams,
  useLoaderData,
} from "@remix-run/react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import type { loader } from "~/routes/explore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "~/components/spinner";
import {
  Globe,
  LogIn,
  LogOut,
  PlusCircle,
  Puzzle,
  Menu as MenuIcon,
  Cpu,
  Settings,
  HelpCircle,
  Mail,
  Fingerprint,
  FileLock2,
  Coins,
  Users2,
  User2,
  ExternalLink,
} from "lucide-react";
import DonationText from "~/components/landing/donate-text";
import DonationiFrame from "~/components/landing/donate-iframe";

export function useFirstRender() {
  const firstRender = useRef(true);

  useEffect(() => {
    firstRender.current = false;
  }, []);

  return firstRender.current;
}

export default function Menu() {
  const [searchParams] = useSearchParams();
  const redirectTo =
    searchParams.size > 0 ? "/explore?" + searchParams.toString() : "/explore";
  const data = useLoaderData<typeof loader>();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const navigation = useNavigation();
  const isLoggingOut = Boolean(navigation.state === "submitting");
  const [timeToToast, setTimeToToast] = useState<Boolean>(false);

  const { t } = useTranslation("menu");

  const firstRender = useFirstRender();

  useEffect(() => {
    if (!firstRender && !timeToToast) {
      setTimeToToast(true);
    } else if (!firstRender && timeToToast) {
      if (data.user === null) {
        toast({
          description: t("toast_logout_success"),
        });
      }
      if (data.user !== null) {
        const creationDate = Date.parse(data.user.createdAt);
        const now = Date.now();
        const diff = now - creationDate;
        if (diff < 10000) {
          toast({
            description: t("toast_user_creation_success"),
          });
          setTimeout(() => {
            toast({
              description: t("toast_login_success"),
            });
          }, 100);
        } else {
          toast({
            description: t("toast_login_success"),
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.user, toast, firstRender]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <div className="pointer-events-auto box-border h-10 w-10">
          <button
            type="button"
            className="h-10 w-10 rounded-full border border-gray-100 bg-white text-center text-black hover:bg-gray-100"
          >
            {data.user === null ? (
              <MenuIcon className="mx-auto h-6 w-6" />
            ) : (
              <User2 className="mx-auto h-6 w-6" />
            )}
          </button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div
          className={
            navigation.state === "loading" ? "pointer-events-none" : ""
          }
        >
          <DropdownMenuLabel className="font-normal">
            {data.user === null ? (
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{t("title")}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {t("subtitle")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {/* Max Mustermann */}
                  {data.user.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {data.user.email}
                </p>
              </div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {data.user !== null ? (
            <DropdownMenuGroup>
              {navigation.state === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
                  <Spinner />
                </div>
              )}
              {data.profile && (
                <DropdownMenuItem>
                  <User2 className="mr-2 h-6 w-6" />
                  <Link to="/profile/me"> Profile</Link>
                </DropdownMenuItem>
              )}

              <Link to="/account/mydevices">
                <DropdownMenuItem className=" cursor-pointer">
                  <Cpu className="mr-2 h-5 w-5" />
                  <span>{t("my_devices_label")}</span>
                </DropdownMenuItem>
              </Link>

              <Link to="/settings/account">
                <DropdownMenuItem className=" cursor-pointer">
                  <Settings className="mr-2 h-5 w-5" />
                  <span>{t("settings_label")}</span>
                </DropdownMenuItem>
              </Link>

              <DropdownMenuItem>
                <Cpu className="mr-2 h-5 w-5" />
                <Link to="/profile/me">{t("my_devices_label")}</Link>
              </DropdownMenuItem>

              <DropdownMenuItem>
                <PlusCircle className="mr-2 h-5 w-5" />
                <span>{t("add_device_label")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuGroup>
          ) : null}
          <DropdownMenuGroup>
            <Link to="https://docs.sensebox.de/" target="_blank">
              <DropdownMenuItem>
                <Puzzle className="mr-2 h-5 w-5" />
                <span>{t("tutorials_label")}</span>
                <ExternalLink className="ml-auto h-4 w-4 text-gray-300" />
              </DropdownMenuItem>
            </Link>

            <Link to="https://docs.opensensemap.org/" target="_blank">
              <DropdownMenuItem>
                <Globe className="mr-2 h-5 w-5" />
                <span>{t("api_docs_label")}</span>
                <ExternalLink className="ml-auto h-4 w-4 text-gray-300" />
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-5 w-5" />
              <span>{t("faq_label")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="mr-2 h-5 w-5" />
              <span>{t("contact_label")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Fingerprint className="mr-2 h-5 w-5" />
              <span>{t("imprint_label")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileLock2 className="mr-2 h-5 w-5" />
              <span>{t("data_protection_label")}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Coins className="mr-2 inline h-5 w-5" />
                  <span> {t("donate_label")}</span>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className={"max-h-screen overflow-y-scroll !max-w-[60%]"}>
                {/* <Donate /> */}
                <div className="grid grid-cols-2">
                  <DonationText />
                  <DonationiFrame/>
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenuItem>
              <Users2 className="mr-2 h-5 w-5" />
              <span>{t("promotion_label")}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            {data.user === null ? (
              <Link
                to={{
                  pathname: "login",
                  search: searchParams.toString(),
                }}
                onClick={() => setOpen(false)}
              >
                <button className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground">
                  <LogIn className="mr-2 h-5 w-5" />
                  <span className="text-green-100">{t("login_label")}</span>
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
              >
                <input type="hidden" name="redirectTo" value={redirectTo} />
                <button
                  type="submit"
                  className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground"
                  disabled={isLoggingOut}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  <span className="text-red-500">{t("logout_label")}</span>
                </button>
              </Form>
            )}
          </DropdownMenuGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
