import Home from "./home";
import NavBar from "./nav-bar/nav-bar";
import Menu from "./menu";
import { useLoaderData } from "@remix-run/react";
import Notification from "./notification";
import { loader } from "~/routes/explore/$deviceId";

interface HeaderProps {
  devices: any;
}

export default function Header(props: HeaderProps) {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="pointer-events-none fixed z-10 flex h-14 w-full items-center justify-between p-2">
      <Home />
      <NavBar devices={props.devices} />
      <div className="flex">
        {data?.user?.email ? <Notification /> : null}
        <Menu />
      </div>
    </div>
  );
}
