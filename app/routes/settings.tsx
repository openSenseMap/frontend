import { Outlet, useLocation, useNavigate } from "@remix-run/react";

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { NavBar } from "~/components/nav-bar";
import ErrorMessage from "~/components/error-message";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  return json({});
}

export default function SettingsLayoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // get current tab from the URL
  const currentTab = location.pathname.split("/")[2];
  return (
    <div className="bg-gray-100 dark:bg-gray-950">
      <NavBar />
      <div className="flex w-full items-start justify-center py-10">
        <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
          <Tabs
            className="w-full"
            defaultValue="account"
            value={currentTab}
            onValueChange={(value) => {
              navigate(`/settings/${value}`);
            }}
          >
            <TabsList className="border-b border-gray-200 dark:border-gray-800">
              <TabsTrigger value="account">Account Information</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
            </TabsList>
            <TabsContent className="mt-6" value={currentTab}>
              <Outlet />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="hidden space-y-6 px-10 pb-16 md:block">
      <NavBar />
      <div className="flex w-full items-center justify-center">
        <ErrorMessage />
      </div>
    </div>
  );
}
