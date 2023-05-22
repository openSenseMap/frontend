import Home from "./home/Home";
import NavBar from "./navBar/NavBar";
import Menu from "./menu/Menu";
import Notification from "./notification/Notification";
import { useLoaderData } from "@remix-run/react";
import { loader } from "~/root";

interface HeaderProps {
  devices: any;
}

export default function Header(props: HeaderProps) {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="flex items-center p-2 w-full h-14 fixed z-10 pointer-events-none">
        <Home />
        <NavBar devices={props.devices} />
        {data?.user?.email ? <Notification /> : null}
        <Menu />
    </div>
  );
}