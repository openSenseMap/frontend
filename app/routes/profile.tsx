import { Outlet } from "@remix-run/react";
import { NavBar } from "~/components/nav-bar";

export default function ProfileLayoutPage() {
  return (
    <div className="h-screen bg-slate-100">
      <NavBar />
      <Outlet />
    </div>
  );
}
