import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useParams } from "@remix-run/react";
import { useState } from "react";
import { getUserId } from "~/session.server";
import {
  ArrowSmallLeftIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";

//* Toast impl.
import * as ToastPrimitive from "@radix-ui/react-toast";
import { clsx } from "clsx";

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

  //* Toast notification when device info is updated
  const [toastOpen, setToastOpen] = useState(false);

  // Get deviceId from route path
  const { boxId } = useParams();
  return (
    <div className="mx-8 mt-14 mr-20">
      {/*Toast notification */}
      <div className={toastOpen ? "mb-12" : ""}>
        <ToastPrimitive.Provider>
          <ToastPrimitive.Root
            open={toastOpen}
            duration={3000}
            onOpenChange={setToastOpen}
            className={clsx(
              " inset-x-4 bottom-4 z-50 w-auto rounded-lg border-[1px] border-[#bce8f1] shadow-lg md:bottom-auto md:left-auto md:right-4 md:top-4 md:w-full",
              "bg-[#d9edf7] dark:bg-gray-800",
              "radix-state-open:animate-toast-slide-in-bottom md:radix-state-open:animate-toast-slide-in-right",
              "radix-state-closed:animate-toast-hide",
              "radix-swipe-direction-right:radix-swipe-end:animate-toast-swipe-out-x",
              "radix-swipe-direction-right:translate-x-radix-toast-swipe-move-x",
              "radix-swipe-direction-down:radix-swipe-end:animate-toast-swipe-out-y",
              "radix-swipe-direction-down:translate-y-radix-toast-swipe-move-y",
              "radix-swipe-cancel:translate-x-0 radix-swipe-cancel:duration-200 radix-swipe-cancel:ease-[ease]",
              "focus-visible:ring-purple-500 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75"
            )}
          >
            <div className="flex">
              <div className="flex w-0 flex-1 items-center p-4">
                <div className="radix w-full">
                  <ToastPrimitive.Title className=" flex justify-between text-base font-medium  text-[#31708f] dark:text-gray-100">
                    {/* Account successfully deleted. */}
                    <div>
                      senseBox succesfully updated -
                      <Link to={`/explore/${boxId}`}>
                        {" "}
                        <span className="text-[#4eaf47] hover:underline">
                          view
                        </span>{" "}
                      </Link>
                    </div>

                    <ToastPrimitive.Close aria-label="Close">
                      <span aria-hidden>×</span>
                    </ToastPrimitive.Close>
                  </ToastPrimitive.Title>
                </div>
              </div>
            </div>
          </ToastPrimitive.Root>
          <ToastPrimitive.Viewport />
        </ToastPrimitive.Provider>
      </div>
      <div className="grid grid-cols-5 gap-10 font-helvetica tracking-wide max-md:grid-cols-2  lg:grid-rows-1">
        <nav className="col-span-5 md:col-span-1">
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

        <main className="col-span-5 md:col-span-4">
          <Outlet context={[toastOpen, setToastOpen]} />
        </main>
      </div>
    </div>
  );
}
