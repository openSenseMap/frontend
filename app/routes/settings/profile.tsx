import { Outlet } from "@remix-run/react";
import { NavBar } from "~/components/nav-bar";

export default function ProfileLayoutPage() {
  return (
    <>
      <div className="hidden space-y-6 px-10 pb-16 md:block">
        <NavBar />
        <div className="mx-auto max-w-screen-2xl space-y-4">
          <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
            <div className="w-full pt-4">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}