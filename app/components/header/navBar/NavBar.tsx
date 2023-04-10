import React, { useEffect, useRef } from 'react';
import Search from '~/components/search/Search';
import type { MapRef } from "react-map-gl";
import { RefObject } from "react";

interface Props {
  mapRef: RefObject<MapRef>;
  devices: any;
}

export default function NavBar( props: Props) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
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
  }, [closeSearch]);

  return (
    <div className="w-1/2 h-10 mx-auto pointer-events-auto">
      {!isHovered && !showSearch ? (
        <div className="flex items-center justify-around w-full h-10 rounded-[1.25rem] bg-white shadow-xl" onMouseEnter={() => { setIsHovered(true)} }>
          <div className="flex items-center justify-center rounded-full bg-orange-500 w-3/12 h-6 space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
            <div className="text-center text-white">
              Temperatur
            </div>
          </div>
          <div className="flex items-center justify-center rounded-full bg-blue-700 w-4/12 h-6 space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
            </svg>
            <div className="text-center text-white">
              01.01.2022 - 05.01-2022
            </div>
          </div>
        </div>
      ) : ((isHovered && !showSearch) ? (
        <div className="items-center w-full h-72 overflow-visible bg-white rounded-[1.25rem] p-2 shadow" onMouseLeave={() => { setIsHovered(false) }}>
          {/* <Link to="?search=active"> */}
            {/* <button onClick={() => displaySearch(true)} className="flex items-center justify-between pl-2 pr-3 mb-2 w-1/2 h-7 rounded-full bg-white space-x-2 mx-auto ring-1 ring-slate-900/10 hover:ring-slate-300 shadow-lg hover:bg-gray-200"> */}
            <button onClick={() => displaySearch()} className="flex items-center justify-between pl-2 pr-3 mb-2 w-1/2 h-7 rounded-full bg-white space-x-2 mx-auto ring-1 ring-slate-900/10 hover:ring-slate-300 shadow-lg hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <span className="text-blue-500 text-center">
                    Suche
                </span>
                <span className="flex-none text-xs text-gray-400 font-semibold">Ctrl + K</span>
            </button>
          {/* </Link> */}
          {/* <Search innerRef={props.innerRef} setShowSearch={props.setShowSearch}/> */}
          <hr className="solid border-t-2"></hr>
          <div>
            {/* Place your content here */}
          </div>
        </div>
      ) : (
        <div className="items-center w-full rounded-[1.25rem] bg-white shadow-xl" onMouseLeave={() => { setIsHovered(false)}} onMouseEnter={() => { setIsHovered(true)}} >
          <Search mapRef={props.mapRef} devices={props.devices} searchRef={searchRef} setShowSearch={() => { setShowSearch(false); setIsHovered(false) }}/>
        </div>
      ))}
    </div>
  );
}