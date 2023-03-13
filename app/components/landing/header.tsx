import { Link } from "@remix-run/react";

export default function Header() {
  return (
    <nav className="rounded border-gray-200 bg-white px-2 py-2.5 shadow-md sm:px-4">
      <div className="container mx-auto flex flex-wrap items-center justify-between font-serif">
        <div className="flex">
          <Link to="/" className="flex items-center pr-10">
            <img src="/logo.png" className="mr-3 h-6 sm:h-9" alt="osem Logo" />
            <span className="self-center whitespace-nowrap text-xl font-semibold">
              openSenseMap
            </span>
          </Link>
          <div
            className="hidden w-full items-center justify-between md:order-1 md:flex md:w-auto text-lg font-bold text-gray-500"
            id="navbar-cta"
          >
            <ul className="bg-gray-50 mt-4 flex flex-col rounded-lg border border-gray-100 p-4 md:mt-0 md:flex-row md:space-x-8 md:border-0 md:bg-white md:text-sm md:font-medium">
              <li>
                <Link
                  to="/explore"
                  rel="intent"
                  className="block rounded py-2 pl-3 pr-4 hover:bg-gray-100 md:p-0 md:hover:bg-transparent md:hover:text-green-700"
                >
                  Explore
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="block rounded py-2 pl-3 pr-4 hover:bg-gray-100 md:p-0 md:hover:bg-transparent md:hover:text-green-700"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="block rounded py-2 pl-3 pr-4 hover:bg-gray-100 md:p-0 md:hover:bg-transparent md:hover:text-green-700"
                >
                  Tools
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="block rounded py-2 pl-3 pr-4 hover:bg-gray-100 md:p-0 md:hover:bg-transparent md:hover:text-green-700"
                >
                  Use cases
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex md:order-2">
          <button
            type="button"
            className="mr-3 rounded-lg bg-green-500 px-5 py-2.5 text-center text-sm font-medium text-black hover:bg-green-300 focus:outline-none focus:ring-4 focus:ring-green-300 md:mr-0"
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
