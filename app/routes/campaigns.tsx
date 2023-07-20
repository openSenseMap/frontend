import { Link, NavLink, Outlet } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import Notification from "~/components/header/notification";

export default function CampaignsPage() {
  const { t } = useTranslation("campaigns");

  const links = [
    {
      name: t("overview"),
      link: "./overview",
    },
    {
      name: "Tutorial",
      link: "./tutorial",
    },
    {
      name: "Info",
      link: "./info",
    },
    {
      name: "Support",
      link: "./support",
    },
  ];
  return (
    <div className="flex h-full min-h-screen flex-col">
      <main>
        <div className="hidden w-full items-center text-gray-400 dark:text-gray-300 md:order-1 md:flex">
          <div className="m-2 flex items-center pr-10">
            <Link to="/">
              <img
                src="/logo.png"
                className="mr-3 h-6 sm:h-9"
                alt="osem Logo"
              />
            </Link>
            <div className="flex flex-col">
              <span className="dark:text-green-200 self-center whitespace-nowrap text-xl font-semibold text-green-100">
                openSenseMap
              </span>
              <span>{t("campaigns")} Manager</span>
            </div>
          </div>

          <ul className="mt-4 flex flex-row p-4 md:space-x-8 md:text-lg">
            {links.map((item, index) => {
              return (
                <li key={index}>
                  <NavLink
                    to={item.link}
                    className={({ isActive }) =>
                      isActive
                        ? "dark:md:hover:text-green-200 block rounded py-2 pl-3 pr-4 underline md:p-0 md:font-thin md:hover:text-green-100"
                        : "dark:md:hover:text-green-200 block rounded py-2 pl-3 pr-4 md:p-0 md:font-thin md:hover:text-green-100"
                    }
                  >
                    {item.name}
                  </NavLink>
                </li>
              );
            })}
          </ul>
          <div className="ml-auto mr-2 mt-2 flex gap-2">
            <Notification />

            <Button size="lg" className=" bg-green-300 text-lg">
              <Link
                to={"../create/area"}
                className="align-center flex items-center"
              >
                <span>{t("create")}</span>
                <PlusIcon className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="container mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
