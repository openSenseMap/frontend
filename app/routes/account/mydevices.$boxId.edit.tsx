import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  Outlet,
} from "@remix-run/react";
import { useState } from "react";
import { getUserId } from "~/session.server";
import {
  ArrowSmallLeftIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";

//*****************************************************
export async function loader({ request, params }: LoaderArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  const deviceID = params.box;

  return json({ DevieID: deviceID });
}

//*****************************************************
export async function action({ request }: ActionArgs) {
  return redirect("/");
}

//**********************************
export default function EditBox() {
  //* default view (General)
  const [currentView, setCurrentView] = useState("general");

  return (
    <div className="mx-8 mt-14">
      <div className="grid grid-flow-col gap-1 font-helvetica tracking-wide max-md:grid-rows-2  lg:grid-rows-1">
        <nav className="col-span-3 md:col-span-3">
          <ul>
            <li className="rounded p-3 text-[#676767] hover:bg-[#eee]">
              <ArrowSmallLeftIcon className=" mr-2 inline h-5 w-5" />
              <Link to="/account/mydevices">Back to Dashboard</Link>
            </li>

            {/* divider */}
            <hr className="my-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

            <Link to="general">
              <li
                className={
                  currentView === "general"
                    ? "rounded bg-[#4eaf47] p-3 text-[#fff]"
                    : "rounded p-3 text-[#676767] hover:bg-[#eee]"
                }
                onClick={() => setCurrentView("general")}
              >
                <TableCellsIcon className=" mr-2 inline h-5 w-5" />
                General
              </li>
            </Link>

            <Link to="sensors">
              <li
                className={
                  currentView === "sensors"
                    ? "rounded bg-[#4eaf47] p-3 text-[#fff]"
                    : "rounded p-3 text-[#676767] hover:bg-[#eee]"
                }
                onClick={() => setCurrentView("sensors")}
              >
                <TableCellsIcon className=" mr-2 inline h-5 w-5" />
                Sensors
              </li>
            </Link>

            <Link to="extensions">
              <li
                className={
                  currentView === "extensions"
                    ? "rounded bg-[#4eaf47] p-3 text-[#fff]"
                    : "rounded p-3 text-[#676767] hover:bg-[#eee]"
                }
                onClick={() => setCurrentView("extensions")}
              >
                <TableCellsIcon className=" mr-2 inline h-5 w-5" />
                Extensions
              </li>
            </Link>
          </ul>
        </nav>

        <main className="col-span-9 md:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
