import Search from ".";
import type { RefObject } from "react";

interface OverlaySearchProps {
  setShowSearch: (data: boolean) => void;
  searchRef: RefObject<HTMLInputElement>;
  devices: any;
}

export default function OverlaySearch(props: OverlaySearchProps) {
  return (
    <div className="absolute h-full w-full">
      <div
        className="fixed inset-0 z-40 h-full w-full bg-black opacity-25"
        onClick={() => props.setShowSearch(false)}
      />
      <div
        data-state="open"
        className="fixed top-[20%] left-[50%] z-50 w-1/2 translate-x-[-50%] items-center rounded-[1.25rem] border border-gray-200 bg-white p-1 shadow-xl focus:outline-none data-[state=open]:animate-contentShow"
      >
        <Search
          devices={props.devices}
          searchRef={props.searchRef}
          setShowSearch={props.setShowSearch}
        />
      </div>
    </div>
  );
}
