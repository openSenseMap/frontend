import Search from "./Search";

interface OverlaySearchProps {
    setShowSearch:(data: boolean) => void;
    searchRef: any;
    devices: any;
}


export default function OverlaySearch(props: OverlaySearchProps) {
    return (
        <div className="absolute w-full h-full">
            <div className="w-full h-full bg-black opacity-25 fixed inset-0 z-40" onClick={() => props.setShowSearch(false)} />  
            <div data-state="open" className="items-center data-[state=open]:animate-contentShow fixed top-[20%] left-[50%] w-1/2 p-1 translate-x-[-50%] rounded-[1.25rem] bg-white shadow-xl focus:outline-none z-50">
                <Search devices={props.devices} searchRef={props.searchRef} setShowSearch={props.setShowSearch}/>
            </div>
        </div>
    );
}