import { Form, Link } from "@remix-run/react";
import { Theme, useTheme } from "~/utils/theme-provider";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import invariant from "tiny-invariant";
import type { header } from "~/lib/directus";
import { useState } from "react";

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

type HeaderProps = {
  data: header;
};

export default function Header(data: HeaderProps) {
  const [theme, setTheme] = useTheme();
  const [openMenu, setOpenMenu] = useState(false);
  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT
    );
  };

  //* User Id and Name
  const userId = data.data.userId;
  const userName = data.data.userName;

  //* To control user menu visibility
  const userMenu = () => {
    console.log("🚀 ~ onClick");
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

        <div className="flex items-center justify-center md:order-2">
          {/* Dark Mood */}
          <div className="flex items-center justify-center pr-8">
            <button onClick={toggleTheme}>
              {theme === "light" ? (
                <MoonIcon className="h-6 w-6 text-gray-300 lg:h-8 lg:w-8" />
              ) : (
                <SunIcon className="h-6 w-6 text-gray-400 lg:h-8 lg:w-8" />
              )}
            </button>
          </div>

          {/* Donation */}
          <button
            type="button"
            className="dark:border-green-200 dark:bg-green-200 hidden rounded-lg border-b-4 border-l-2 border-r-4 border-t-2 border-green-100 p-2 text-center text-lg font-thin text-black dark:text-gray-400 md:block"
          >
            <Link
              to="https://www.betterplace.org/de/projects/89947-opensensemap-org-die-freie-karte-fuer-umweltdaten"
              target="_blank"
              rel="noopener noreferrer"
            >
              Donate
            </Link>
          </button>

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

        {/* Collapsible user profile menu */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 md:order-2">
          {/* login button */}
          {!userId ? (
            <a
              href="/login"
              className="block px-4 py-2  text-lg text-gray-700"
              role="menuitem"
              tabIndex={-1}
              id="user-menu-item-1"
            >
              Login
            </a>
          ) : (
            <div className="relative ml-3">
              <div>
                <button
                  type="button"
                  className="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-gray-800"
                  id="user-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                  onClick={userMenu}
                >
                  <span className="sr-only">Open user menu</span>
                  {/* avatar icon */}
                  <div className=" h-10 w-10 overflow-hidden bg-white text-[#777] hover:text-[#333] dark:rounded-full dark:bg-[#000] hover:dark:text-[#fff]">
                    <svg
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </div>
                </button>
              </div>

              {/* user menu */}
              <div
                className="profile-menu invisible absolute right-0 z-10 mt-2 w-48 origin-top-right divide-y divide-solid rounded-md bg-white py-1 font-mono tracking-tighter shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
                tabIndex={-1}
              >
                <div>
                  <p
                    className="block px-4 py-2 text-sm text-gray-700"
                    role="menuitem"
                    tabIndex={-1}
                    id="user-menu-item-0"
                  >
                    Singed in as <b>{userName}</b>
                  </p>
                </div>

                <div>
                  <a
                    href="/account/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    tabIndex={-1}
                    id="user-menu-item-1"
                  >
                    Dashboard
                  </a>

                  <a
                    href="/routeToNewBox"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    tabIndex={-1}
                    id="user-menu-item-2"
                  >
                    New senseBox
                  </a>
                </div>

                <div>
                  <a
                    href="/account/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    tabIndex={-1}
                    id="user-menu-item-1"
                  >
                    Settings
                  </a>

                  <Form
                    action="/logout"
                    method="post"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <button type="submit" id="user-menu-item-2">
                      Sign out
                    </button>
                  </Form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
