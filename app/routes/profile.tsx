import { Outlet } from "@remix-run/react";
import { NavBar } from "~/components/nav-bar";

export default function ProfileLayoutPage() {
  return (
    <div className="h-full bg-slate-100">
      <NavBar />
      <Outlet />
    </div>
  );
}
