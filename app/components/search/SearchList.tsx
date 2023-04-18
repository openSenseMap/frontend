import { CpuChipIcon, GlobeEuropeAfricaIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "@remix-run/react";
import { useMap } from "react-map-gl";
import type { LngLatBounds, LngLatLike } from "react-map-gl";

interface SearchListProps {
    searchResultsLocation: any;
    searchResultsDevice: any;
    setShowSearch:(data: boolean) => void;
}

export default function SearchList(props: SearchListProps) {
    const navigate = useNavigate();
    const {osem} = useMap();

    /**
     * The function that is called when the user clicks on a location without bbox property in the search results. It flies the map to the location and closes the search results.
     * 
     * @param center the coordinate of the center of the location to fly to
     */
    const goToLocation = (center: LngLatLike) => {
        osem?.flyTo({
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
    const goToLocationBBox = (bbox: LngLatBounds) => {
        osem?.fitBounds(bbox, {
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
        osem?.flyTo({
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
                            <CpuChipIcon className="w-6 h-6"/>
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
                                <GlobeEuropeAfricaIcon className="w-6 h-6"/>
                          
                            :
                                <MapPinIcon className="w-6 h-6"/>
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