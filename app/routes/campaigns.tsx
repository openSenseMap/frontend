import { Link, NavLink, Outlet } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { MenuIcon, PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import Notification from "~/components/header/notification";
import { useLoaderData } from "@remix-run/react";
import { json, type LoaderArgs } from "@remix-run/server-runtime";
import { getUser } from "~/session.server";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import clsx from "clsx";

export async function loader({ request }: LoaderArgs) {
  return json({
    user: await getUser(request),
  });
}

export default function CampaignsPage() {
  const data = useLoaderData<typeof loader>();
  const { t } = useTranslation("campaigns");

  // function HamburgerMenu({ links }) {
  //   const [showMenu, setShowMenu] = useState(false);

  //   const toggleMenu = () => {
  //     setShowMenu(!showMenu);
  //   };

  //   return (
  //     <div>
  //       <Button size="sm" variant="outline" onClick={toggleMenu}>
  //         <MenuIcon className="h-4 w-4" />
  //       </Button>
  //       {showMenu && (
  //         <DropdownMenu>
  //           {links.map((item, index) => (
  //             <Dropdown.Item key={index} href={item.link}>
  //               {item.name}
  //             </Dropdown.Item>
  //           ))}
  //         </DropdownMenu>
  //       )}
  //     </div>
  //   );
  // }
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768); // Adjust the breakpoint as needed
    };

    handleResize(); // Check on initial render

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const links = [
    // {
    //   name: "Info",
    //   link: "./info",
    // },
    {
      name: t("explore"),
      link: "./explore",
    },
    {
      name: "Tutorial",
      link: "./tutorial",
    },

    {
      name: "Support",
      link: "./support",
    },
  ];
  return (
    <>
      <nav className="relative z-50 mx-auto flex w-full justify-between px-2 py-2 dark:border-gray-300 dark:bg-black sm:px-6 md:py-8 lg:px-8">
        <div className="container z-50 mx-auto flex w-full flex-wrap items-center justify-between font-serif">
          {/* Osem Logo*/}
          <div className="flex w-full flex-wrap items-center justify-between">
            {/* Osem Logo*/}
            <Link to="/" className="flex items-center md:pr-10">
              <img
                src="/logo.png"
                className="mr-3 h-6 sm:h-9"
                alt="osem Logo"
              />
              <span className="dark:text-green-200 hidden self-center whitespace-nowrap text-xl font-semibold text-green-100 md:block">
                openSenseMap
              </span>
            </Link>
            {/* Navbar Links*/}
            <div
              className={
                "hidden w-full items-center justify-between text-gray-400 dark:text-gray-300 lg:order-1 lg:flex lg:w-auto "
              }
              id="navbar-cta"
            >
              <ul className="mt-4 flex flex-col rounded-lg p-4 md:mt-0 md:flex-row md:space-x-8 md:text-lg">
                {links.map((item, index) => {
                  return (
                    <li key={index}>
                      <NavLink
                        to={item.link}
                        className={({ isActive }) =>
                          clsx(
                            "dark:md:hover:text-green-200 block rounded py-2 pl-3 pr-4  md:p-0 md:font-thin md:hover:text-green-100",
                            {
                              underline: isActive,
                            }
                          )
                        }
                      >
                        {item.name}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="ml-auto mr-2 mt-2 flex gap-2 lg:order-2">
              {data?.user?.email ? <Notification /> : null}

              <Button size="lg" className=" bg-green-300 text-lg">
                <Link
                  to={"../create/area"}
                  className="align-center flex items-center"
                >
                  <span>{t("create")}</span>
                  <PlusIcon className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <div className="container mx-auto">
        <Outlet />
      </div>
    </>

    // <div className="flex h-full min-h-screen flex-col">
    //   <main>
    //     <div className="flex w-full items-center justify-center text-gray-400 dark:text-gray-300">
    //       <div className="m-2 flex flex-col">
    //         <Link to="/">
    //           <img src="/logo.png" className="h-9 w-auto" alt="osem Logo" />
    //         </Link>
    //         {/* <div className="flex flex-col"> */}
    //         <span className="dark:text-green-200 self-center whitespace-nowrap text-xl font-semibold text-green-100">
    //           openSenseMap
    //         </span>
    //         <span>{t("campaigns")} Manager</span>
    //         {/* </div> */}
    //       </div>
    //       {!isMobileScreen ? (
    //         <ul className="mx-14 mt-4 flex w-full flex-row justify-between gap-2 p-4 md:text-lg">
    //           {links.map((item, index) => {
    //             return (
    //               <li key={index}>
    //                 <NavLink
    //                   to={item.link}
    //                   className={({ isActive }) =>
    //                     isActive
    //                       ? "dark:md:hover:text-green-200 block rounded py-2 pl-3 pr-4 underline md:p-0 md:font-thin md:hover:text-green-100"
    //                       : "dark:md:hover:text-green-200 block rounded py-2 pl-3 pr-4 md:p-0 md:font-thin md:hover:text-green-100 "
    //                   }
    //                 >
    //                   {item.name}
    //                 </NavLink>
    //               </li>
    //             );
    //           })}
    //         </ul>
    //       ) : (
    //         <DropdownMenu>
    //           <DropdownMenuTrigger asChild>
    //             <Button size="sm" variant="outline">
    //               <MenuIcon className="h-4 w-4" />
    //             </Button>
    //           </DropdownMenuTrigger>
    //           <DropdownMenuContent>
    //             {links.map((item, index) => {
    //               return (
    //                 <DropdownMenuItem key={index}>
    //                   <a href={item.link}>{item.name}</a>
    //                 </DropdownMenuItem>
    //               );
    //             })}
    //           </DropdownMenuContent>
    //         </DropdownMenu>
    //       )}

    //       <div className="ml-auto mr-2 mt-2 flex gap-2">
    //         {data?.user?.email ? <Notification /> : null}

    //         <Button size="lg" className=" bg-green-300 text-lg">
    //           <Link
    //             to={"../create/area"}
    //             className="align-center flex items-center"
    //           >
    //             <span>{t("create")}</span>
    //             <PlusIcon className="ml-2 h-5 w-5" />
    //           </Link>
    //         </Button>
    //       </div>
    //     </div>

    //     <div className="container mx-auto">
    //       <Outlet />
    //     </div>
    //   </main>
    // </div>
  );
}
