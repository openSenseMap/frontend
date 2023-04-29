import { Link } from "@remix-run/react";
import { Theme, useTheme } from "~/utils/themeProvider";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";

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
  {
    name: "Campaigns",
    link: "/campaigns",
  },
];

export default function Header() {
  const [theme, setTheme] = useTheme();
  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT
    );
  };

  return (
    <nav className="absolute top-0 z-50 w-full border-b-2 border-gray-400 bg-white px-2 py-2.5 dark:border-gray-300 dark:bg-black sm:px-4">
      <div className="container z-50 mx-auto flex flex-wrap items-center justify-between font-serif">
        <div className="flex">
          <Link to="/" className="flex items-center pr-10">
            <img src="/logo.png" className="mr-3 h-6 sm:h-9" alt="osem Logo" />
            <span className="dark:text-green-200 self-center whitespace-nowrap text-xl font-semibold text-green-100">
              openSenseMap
            </span>
          </Link>
          <div
            className="hidden w-full items-center justify-between text-gray-400 dark:text-gray-300 md:order-1 md:flex md:w-auto"
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
          <div className="flex items-center justify-center pr-8">
            <button onClick={toggleTheme}>
              {theme === "light" ? (
                <MoonIcon className="h-6 w-6 text-gray-300 lg:h-8 lg:w-8" />
              ) : (
                <SunIcon className="h-6 w-6 text-gray-400 lg:h-8 lg:w-8" />
              )}
            </button>
          </div>
          <button
            type="button"
            className="dark:border-green-200 dark:bg-green-200 rounded-lg border-l-2 border-t-2 border-r-4 border-b-4 border-green-100 p-2 text-center text-lg font-thin text-black"
          >
            <Link to="/explore" rel="intent">
              Donate
            </Link>
          </button>
          <button
            data-collapse-toggle="navbar-cta"
            type="button"
            className="inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 md:hidden"
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
        </div>
      </div>
    </nav>
  );
}
