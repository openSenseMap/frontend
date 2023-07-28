import { Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { useState } from "react";
import LanguageSelector from "./language-selector";
import ThemeSelector from "./theme-selector";

const links = [
  {
    name: "Explore",
    link: "/explore",
  },
  {
    name: "Features",
    link: "#features",
  },
  {
    name: "Tools",
    link: "#tools",
  },
  {
    name: "Use Cases",
    link: "#useCases",
  },
  {
    name: "Partners",
    link: "#partners",
  },
];

export default function Header() {
  const { header } = useLoaderData<{
    header: { userId: string; userName: string; };
  }>();
  const [openMenu, setOpenMenu] = useState(false);

  //* User Id and Name
  const userId = header.userId;
  const userName = header.userName;

  //* To control user menu visibility
  const userMenu = () => {
    const profileMenu = document.querySelector(".profile-menu");
    invariant(profileMenu, "profileMenu is not found");
    let profileMenuStatus = profileMenu.classList.contains("invisible");
    if (profileMenuStatus) {
      profileMenu.classList.remove("invisible");
      profileMenu.classList.add("visible");
    } else {
      profileMenu.classList.remove("visible");
      profileMenu.classList.add("invisible");
    }
  };

  return (
    <nav className="relative z-50 mx-auto flex max-w-7xl justify-between px-2 py-2 dark:border-gray-300 dark:bg-black sm:px-6 md:py-8 lg:px-8">
      <div className="container z-50 mx-auto flex flex-wrap items-center justify-between font-serif">
        {/* Osem Logo*/}
        <div className="flex max-w-screen-xl flex-wrap items-center justify-between">
          {/* Osem Logo*/}
          <Link to="/" className="flex items-center md:pr-10">
            <img src="/logo.png" className="mr-3 h-6 sm:h-9" alt="osem Logo" />
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
                    <Link
                      to={item.link}
                      className="dark:md:hover:text-green-200 block rounded py-2 pl-3 pr-4 md:p-0 md:font-thin md:hover:text-green-100"
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-center md:order-2">
            {/* Theme */}
            <ThemeSelector />
            {/* Language */}
            <LanguageSelector />
            {/* Collapsible navigation bar */}
            <button
              onClick={() => setOpenMenu(!openMenu)}
              data-collapse-toggle="navbar-cta"
              type="button"
              className="inline-flex items-center rounded-lg p-2 px-6 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 lg:hidden"
              aria-controls="navbar-cta"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
            {openMenu && (
              <div
                className="absolute right-2 top-full mt-2 w-48 rounded-md bg-gray-200 py-2 shadow-lg ring-1 ring-black ring-opacity-5"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="options-menu"
              >
                {links.map((item, index) => (
                  <Link
                    key={index}
                    to={item.link}
                    className="dark:hover:text-green-200 block px-4 py-2 text-sm text-gray-700 hover:text-green-100"
                    role="menuitem"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
