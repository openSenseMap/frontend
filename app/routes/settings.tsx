import { Outlet, useLocation, useNavigate } from "@remix-run/react";
import { NavBar } from "~/components/nav-bar";
import ErrorMessage from "~/components/error-message";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export default function SettingsLayoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // get current tab from the URL
  const currentTab = location.pathname.split("/")[2];
  return (
    <div className="h-screen bg-gray-100 dark:bg-dark-background dark:text-dark-text">
      <NavBar />
      <div className="flex w-full items-start justify-center py-10 bg-gray-100 dark:bg-dark-background">
        <div className="w-full max-w-3xl rounded-lg bg-transparent p-6 dark:shadow-none dark:bg-transparent dark:text-dark-text">
          <Tabs
            className="w-full"
            defaultValue="account"
            value={currentTab || "account"}
            onValueChange={(value) => {
              navigate(`/settings/${value}`);
            }}
          >
            <TabsList>
              <TabsTrigger value="profile">Public Profile</TabsTrigger>
              <TabsTrigger value="account">Account Information</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="delete">Delete Account</TabsTrigger>
            </TabsList>
            <TabsContent className="mt-6" value={currentTab || "account"}>
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
