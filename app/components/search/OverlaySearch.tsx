import { RefObject } from "react";
import Search from "./Search";
import { MapRef } from "react-map-gl";

interface Props {
    setShowSearch:(data: boolean) => void;
    searchRef: any;
    mapRef: RefObject<MapRef>;
    devices: any;
}


export default function OverlaySearch(props: Props) {
    return (
        <div className="absolute w-full h-full">
            <div className="w-full h-full bg-black opacity-25 fixed inset-0 z-40" onClick={() => props.setShowSearch(false)} />  
            <div data-state="open" className="items-center data-[state=open]:animate-contentShow fixed top-[20%] left-[50%] w-1/2 p-1 translate-x-[-50%] rounded-[1.25rem] bg-white shadow-xl focus:outline-none z-50">
                <Search mapRef={props.mapRef} devices={props.devices} searchRef={props.searchRef} setShowSearch={props.setShowSearch}/>
            </div>
        </div>
    );
}