import { useNavigate } from "@remix-run/react";

interface Props {
    searchResultsLocation: any;
    searchResultsDevice: any;
    setShowSearch:(data: boolean) => void;
    mapRef: any;
}

export default function SearchList(props: Props) {
    const navigate = useNavigate();

    /**
     * The function that is called when the user clicks on a location without bbox property in the search results. It flies the map to the location and closes the search results.
     * 
     * @param center the coordinate of the center of the location to fly to
     */
    const goToLocation = (center: number[]) => {
        props.mapRef.current?.flyTo({
            center: center,
            animate:true,
            speed: 1.6,
            zoom: 20,
            essential: true
        });
        props.setShowSearch(false);
        navigate('/explore');
    };

    /**
     * The function that is called when the user clicks on a location with the bbox property in the search results. It flies the map to the location and closes the search results.
     * 
     * @param bbox 
     */
    const goToLocationBBox = (bbox: any) => {
        props.mapRef.current?.fitBounds(bbox, {
            padding: {top: 10},
            animate: true,
            speed: 1.6,
        });
        props.setShowSearch(false);
        navigate('/explore');
    };

    /**
     * The function that is called when the user clicks on a device in the search results. It flies the map to the device and closes the search results.
     * 
     * @param lng longitude of the device
     * @param lat latitude of the device
     * @param id id of the device
     */
    const goToDevice = ( lng: number, lat: number, id: string ) => {
        props.mapRef.current?.flyTo({
            center: [lng, lat],
            animate:true,
            speed: 1.6,
            zoom: 15,
            essential: true
        });
        props.setShowSearch(false);
        navigate(`/explore/${id}`);
    }

    return (
        <div className="w-full overflow-visible bg-white rounded-[1.25rem] pb-2 z-50">
            {props.searchResultsDevice.length > 0 ? <hr className="solid border-t-2 m-2"/> : null}
            <ul>
                {props.searchResultsDevice.map((device: any) => {
                    return (
                        <li onClick={() => {goToDevice(device.lng, device.lat, device.deviceId)}} className="flex hover:bg-gray-300 mx-2 z-50" key={device.deviceId} >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                            </svg>
                            <p className="pl-2">
                                {device.display_name}
                            </p>
                        </li>
                    )
                })}
                {props.searchResultsLocation.length > 0 ? <hr className="solid border-t-2 m-2"/> : null}
                {props.searchResultsLocation.map((location: any) => {
                    return (
                        <li onClick={() => { if (location.hasOwnProperty('bbox')) {goToLocationBBox(location.bbox)} else {goToLocation(location.center)}} } className="flex hover:bg-gray-300 mx-2" key={location.id} >
                           { location.place_type.includes("country") ?
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 01-.421-.585l-1.08-2.16a.414.414 0 00-.663-.107.827.827 0 01-.812.21l-1.273-.363a.89.89 0 00-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 01-1.81 1.025 1.055 1.055 0 01-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 01-1.383-2.46l.007-.042a2.25 2.25 0 01.29-.787l.09-.15a2.25 2.25 0 012.37-1.048l1.178.236a1.125 1.125 0 001.302-.795l.208-.73a1.125 1.125 0 00-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 01-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 01-1.458-1.137l1.411-2.353a2.25 2.25 0 00.286-.76m11.928 9.869A9 9 0 008.965 3.525m11.928 9.868A9 9 0 118.965 3.525" />
                                </svg>
                          
                            :
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                </svg>
                            }
                            <p className="pl-2">
                                {location.place_name}
                            </p>       
                        </li>
                    )
                })}
            </ul>
        </div>
    );
}