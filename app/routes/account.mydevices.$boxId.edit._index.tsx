import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useParams } from "@remix-run/react";
import { useState } from "react";
import { getUserId } from "~/session.server";

//* Toast impl.
import * as ToastPrimitive from "@radix-ui/react-toast";
import { clsx } from "clsx";
import {
  ArrowRightLeft,
  Lock,
  MapPin,
  FileText,
  Wifi,
  Sheet,
  Cpu,
  ArrowLeft,
  UploadCloud,
} from "lucide-react";
import Home from "~/components/header/home";
import { Separator } from "~/components/ui/separator";
import { EditDviceSidebarNav } from "~/components/mydevices/edit-device/edit-device-sidebar-nav";

//*****************************************************
export async function loader({ request, params }: LoaderArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  const deviceID = params.boxId;

  return json({ DevieID: deviceID });
}

//*****************************************************
export async function action({ request }: ActionArgs) {
  return redirect("/");
}

//**********************************
export default function EditBox2() {
  //* Toast notification when device info is updated
  const [toastOpen, setToastOpen] = useState(false);

  // Get deviceId from route path
  const { boxId } = useParams();

  const sidebarNavItems = [
    {
      title: "General",
      href: `/account/mydevices/${boxId}/edit/general`,
      icon: Sheet,
    },
    {
      title: "Sensors",
      href: `/account/mydevices/${boxId}/edit/sensors`,
      icon: Cpu,
    },
    {
      title: "location",
      href: `/account/mydevices/${boxId}/edit/location`,
      icon: MapPin,
    },
    {
      title: "security",
      href: `/account/mydevices/${boxId}/edit/security`,
      icon: Lock,
    },
    {
      title: "script",
      href: `/account/mydevices/${boxId}/edit/script`,
      icon: FileText,
    },
    {
      title: "mqtt",
      href: `/account/mydevices/${boxId}/edit/mqtt`,
      icon: Wifi,
    },
    {
      title: "ttn",
      href: `/account/mydevices/${boxId}/edit/ttn`,
      icon: UploadCloud,
    },
    {
      title: "transfer",
      href: `/account/mydevices/${boxId}/edit/transfer`,
      icon: ArrowRightLeft,
    },
  ];

  return (
    <>
      <div className="pointer-events-none z-10 flex h-14 w-full p-2">
        <Home />
      </div>

      <div className="space-y-6 p-10 pb-14">
        {/*Toast notification */}
        <div className={toastOpen ? "mb-2" : ""}>
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
                "radix-swipe-cancel:translate-x-0 radix-swipe-cancel:duration-200 radix-swipe-cancel:ease-&lsqb;ease&rsqb;",
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

        <div className="rounded text-[#676767]">
          <ArrowLeft className=" mr-2 inline h-5 w-5" />
          <Link to="/account/mydevices">Back to Dashboard</Link>
        </div>

        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Device settings</h2>
          <p className="text-muted-foreground">Manage your device data.</p>
        </div>
        <Separator />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          {/* <div className="grid sm:flex sm:flex-col sm:space-x-12 lg:flex  lg:flex-row lg:space-x-12 lg:space-y-0"> */}
          <aside className="-mx-4 lg:w-1/5">
            <EditDviceSidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1">
            <Outlet context={[setToastOpen]} />
          </div>
        </div>
      </div>
    </>
  );
}
