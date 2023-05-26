import Home from "./home";
import NavBar from "./nav-bar/nav-bar";
import Menu from "./menu";

interface HeaderProps {
  devices: any;
}

export default function Header(props: HeaderProps) {
  return (
    <div className="pointer-events-none fixed z-10 flex h-14 w-full items-center p-2">
      <Home />
      <NavBar devices={props.devices} />
      <Menu />
    </div>
  );
}
