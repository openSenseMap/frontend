import React, { useEffect, useRef } from "react";
import Search from "~/components/search/Search";
import { SunIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import { Calendar } from "@/components/ui/calendar";

interface NavBarProps {
  devices: any;
}

export default function NavBar(props: NavBarProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const searchRef = useRef<HTMLInputElement>(null);

  /**
   * Focus the search input
   */
  const focusSearchInput = () => {
    searchRef.current?.focus();
  };

  /**
   * Display the search
   */
  const displaySearch = () => {
    setShowSearch(true);
    setTimeout(() => {
      focusSearchInput();
    }, 100);
  };

  /**
   * Close the search when the escape key is pressed
   *
   * @param event event object
   */
  const closeSearch = (event: any) => {
    if (event.key === "Escape") {
      setShowSearch(false);
    }
  };

  /**
   * useEffect hook to attach and remove the event listener
   */
  useEffect(() => {
    // attach the event listener
    document.addEventListener("keydown", closeSearch);

    // remove the event listener
    return () => {
      document.removeEventListener("keydown", closeSearch);
    };
  });

  return (
    <div className="pointer-events-auto mx-auto h-10 w-1/2">
      {!isHovered && !showSearch ? (
        <div
          className="flex h-10 w-full items-center justify-around rounded-[1.25rem] border border-gray-100 bg-white shadow-xl"
          onMouseEnter={() => {
            setIsHovered(true);
          }}
        >
          <div className="flex h-6 w-3/12 items-center justify-center space-x-2 rounded-full bg-orange-500">
            <SunIcon className="h-4 w-4 text-white" />
            <div className="text-center text-white">Temperatur</div>
          </div>
          <div className="flex h-6 w-4/12 items-center justify-center space-x-2 rounded-full bg-blue-700">
            <CalendarDaysIcon className="h-4 w-4 text-white" />
            <div className="text-center text-white">
              01.01.2022 - 05.01-2022
            </div>
          </div>
        </div>
      ) : isHovered && !showSearch ? (
        <div
          className="w-full items-center overflow-visible rounded-[1.25rem] border border-gray-100 bg-white p-2 shadow"
          onMouseLeave={() => {
            setIsHovered(false);
          }}
        >
          <button
            onClick={() => displaySearch()}
            className="ring-slate-900/10 hover:ring-slate-300 mx-auto mb-2 flex h-7 w-1/2 items-center justify-between space-x-2 rounded-full bg-white pl-2 pr-3 shadow-lg ring-1 hover:bg-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6 text-blue-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <span className="text-center text-blue-500">Suche</span>
            <span className="flex-none text-xs font-semibold text-gray-400">
              <kbd>Ctrl</kbd> + <kbd>K</kbd>
            </span>
          </button>
          <hr className="solid border-t-2 p-2"></hr>
          <div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="mx-auto rounded-md border"
            />
          </div>
        </div>
      ) : (
        <div
          className="w-full items-center rounded-[1.25rem] border border-gray-100 bg-white p-1 shadow-xl"
          onMouseLeave={() => {
            setIsHovered(false);
          }}
          onMouseEnter={() => {
            setIsHovered(true);
          }}
        >
          <Search
            devices={props.devices}
            searchRef={searchRef}
            setShowSearch={() => {
              setShowSearch(false);
              setIsHovered(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
