import React, { useEffect, useRef } from 'react';
import Search from '~/components/search/Search';
import { SunIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { Calendar } from "@/components/ui/calendar"


interface NavBarProps {
  devices: any;
}

export default function NavBar( props: NavBarProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(new Date())
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
  }

  /**
   * Close the search when the escape key is pressed
   * 
   * @param event event object
   */
  const closeSearch = (event: any) => {
    if (event.key === 'Escape') {
      setShowSearch(false);
    }
  }

  /**
   * useEffect hook to attach and remove the event listener
   */
  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', closeSearch);

    // remove the event listener
    return () => {
      document.removeEventListener('keydown', closeSearch);
    };
  });

  return (
    <div className="w-1/2 h-10 mx-auto pointer-events-auto">
      {!isHovered && !showSearch ? (
        <div className="flex items-center justify-around w-full h-10 rounded-[1.25rem] bg-white shadow-xl" onMouseEnter={() => { setIsHovered(true)} }>
          <div className="flex items-center justify-center rounded-full bg-orange-500 w-3/12 h-6 space-x-2">
            <SunIcon className="w-4 h-4 text-white"/>
            <div className="text-center text-white">
              Temperatur
            </div>
          </div>
          <div className="flex items-center justify-center rounded-full bg-blue-700 w-4/12 h-6 space-x-2">
            <CalendarDaysIcon className="w-4 h-4 text-white"/>
            <div className="text-center text-white">
              01.01.2022 - 05.01-2022
            </div>
          </div>
        </div>
      ) : ((isHovered && !showSearch) ? (
        <div className="items-center w-full overflow-visible bg-white rounded-[1.25rem] p-2 shadow" onMouseLeave={() => { setIsHovered(false) }}>
          <button onClick={() => displaySearch()} className="flex items-center justify-between pl-2 pr-3 mb-2 w-1/2 h-7 rounded-full bg-white space-x-2 mx-auto ring-1 ring-slate-900/10 hover:ring-slate-300 shadow-lg hover:bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <span className="text-blue-500 text-center">
                  Suche
              </span>
              <span className="flex-none text-xs text-gray-400 font-semibold">Ctrl + K</span>
          </button>
          <hr className="solid border-t-2 p-2"></hr>
          <div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border mx-auto"
            />
          </div>
        </div>
      ) : (
        <div className="items-center w-full rounded-[1.25rem] bg-white shadow-xl p-1" onMouseLeave={() => { setIsHovered(false)}} onMouseEnter={() => { setIsHovered(true)}} >
          <Search devices={props.devices} searchRef={searchRef} setShowSearch={() => { setShowSearch(false); setIsHovered(false) }}/>
        </div>
      ))}
    </div>
  );
}