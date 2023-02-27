import Home from "./home/Home";
import NavBar from "./navBar/NavBar";
import Menu from "./menu/Menu";

export default function () {
  return (
    <div className="flex items-center p-2 w-full h-14 fixed z-10 pointer-events-none">
        <Home />
        <NavBar />
        <Menu />
    </div>
  );
}