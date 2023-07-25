import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { SidebarNav } from "~/components/sidebar-nav";
import { Separator } from "~/components/ui/separator";

import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { Button } from "~/components/ui/button";
import { NavBar } from "~/components/nav-bar";

const sidebarNavItems = [
  {
    title: "Profile",
    href: "profile",
  },
  {
    title: "Account",
    href: "account",
  },
  {
    title: "Notifications",
    href: "notifications",
  },
];

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);
  return json({});
}

export default function SettingsLayoutPage() {
  return (
    <>
      <div className="hidden space-y-6 px-10 pb-16 md:block">
        <NavBar></NavBar>
        <div className="mx-auto max-w-screen-2xl space-y-4">
          <div className="flex justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
              <p className="text-muted-foreground">
                Manage your account settings and set e-mail preferences.
              </p>
            </div>
            <Button>
              <Link to="/profile/me">Go to your personal profile</Link>
            </Button>
          </div>
          <Separator className="my-6" />
          <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
            <aside className="lg:w-1/5">
              <SidebarNav items={sidebarNavItems} />
            </aside>
            <div className="flex-1 pt-4">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
