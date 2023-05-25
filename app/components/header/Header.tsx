import Home from "./home/Home";
import NavBar from "./navBar/NavBar";
import Menu from "./menu/Menu";

interface HeaderProps {
  devices: any;
}

export default function Header(props: HeaderProps) {
  return (
    <div className="flex justify-between items-center p-2 w-full h-14 fixed z-10 pointer-events-none">
        <Home />
        <NavBar devices={props.devices} />
        <Menu />
    </div>
  );
}