import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";

const links = [
  {
    name: "Overview",
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

export default function CampaignsPage() {
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
              <span>Kampagnen Manager</span>
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
          {/* <Link
            to={"../explore/draw_campaign_area/modal"}
            className="ml-auto mt-2 mr-2"
          >
            <Button size="lg" className="bg-green-300 text-lg ">
              Erstellen
            </Button>
          </Link> */}
          <div className="ml-auto mr-2 mt-2">
            <Button size="lg" className=" bg-green-300 text-lg">
              <Link
                to={"../create/area"}
                className="align-center flex items-center"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                <span>Erstellen</span>
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
