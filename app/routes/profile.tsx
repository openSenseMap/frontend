import { Outlet } from "@remix-run/react";
import { NavBar } from "~/components/nav-bar";

export default function ProfileLayoutPage() {
  return (
    <div className="h-screen bg-while dark:bg-dark-background">
      <NavBar />
      <Outlet />
    </div>
  );
}
