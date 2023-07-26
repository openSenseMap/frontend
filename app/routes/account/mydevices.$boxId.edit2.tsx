import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useLocation, useParams } from "@remix-run/react";
import { useState } from "react";
import { getUserId } from "~/session.server";
import {
  ArrowSmallLeftIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  TableCellsIcon,
  WifiIcon,
} from "@heroicons/react/24/outline";

//* Toast impl.
import * as ToastPrimitive from "@radix-ui/react-toast";
import { clsx } from "clsx";
import { ArrowRightLeft, Lock, MapPin } from "lucide-react";
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
  //* to keep selected view highlited after reloading
  const pathName = useLocation().pathname;
  const currentPage = pathName.substring(pathName.lastIndexOf("/") + 1);
  //* default view (General)
  const [currentView, setCurrentView] = useState(currentPage);

  //* Toast notification when device info is updated
  const [toastOpen, setToastOpen] = useState(false);

  // Get deviceId from route path
  const { boxId } = useParams();

  const sidebarNavItems = [
    {
      title: "General",
      href: `/account/mydevices/${boxId}/edit2/general`,
      icon: TableCellsIcon
    },
    {
      title: "Sensors",
      href: `/account/mydevices/${boxId}/edit2/sensors`,
      icon: TableCellsIcon
    },
    {
      title: "location",
      href: `/account/mydevices/${boxId}/edit2/location`,
      icon: MapPin
    },
    {
      title: "security",
      href: `/account/mydevices/${boxId}/edit2/security`,
      icon: Lock
    },
    {
      title: "script",
      href: `/account/mydevices/${boxId}/edit2/script`,
      icon: DocumentTextIcon
    },
    {
      title: "mqtt",
      href: `/account/mydevices/${boxId}/edit2/mqtt`,
      icon: WifiIcon
    },
    {
      title: "ttn",
      href: `/account/mydevices/${boxId}/edit2/ttn`,
      icon: CloudArrowUpIcon
    },
    {
      title: "transfer",
      href: `/account/mydevices/${boxId}/edit2/transfer`,
      icon: ArrowRightLeft
    },
  ];

  return (
    <>
    <div className="pointer-events-none z-10 mb-4 flex h-14 w-full p-2">
        <Home />
      </div>

      <div className="space-y-6 p-10 pb-14">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Device settings</h2>
          <p className="text-muted-foreground">
            Manage your device data.
          </p>
        </div>
        <Separator  />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        {/* <div className="grid sm:flex sm:flex-col sm:space-x-12 lg:flex  lg:flex-row lg:space-x-12 lg:space-y-0"> */}
          <aside className="-mx-4 lg:w-1/5">
            <EditDviceSidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1">
            <Outlet context={[setToastOpen]}/>
          </div>
        </div>
      </div>
    </>
  );
}
