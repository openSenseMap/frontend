import { useEffect, useState } from "react";
import type { RefObject } from "react";
import SearchList from "./SearchList";

interface SearchProps {
  setShowSearch: (data: boolean) => void;
  searchRef: RefObject<HTMLInputElement>;
  devices: any;
}

export default function Search(props: SearchProps) {
  const [searchString, setSearchString] = useState<string>("");
  const [searchResultsLocation, setSearchResultsLocation] = useState<any[]>([]);
  const [searchResultsDevice, setSearchResultsDevice] = useState<any[]>([]);

  /**
   * One of the functions that is called when the user types in the search bar. It returns the search results for locations, retrived from the mapbox geocode API.
   *
   * @param searchstring string to search for locations on mapbox geocode API
   */
  function getLocations(searchstring: string) {
    var url: URL = new URL(ENV.MAPBOX_GEOCODING_API + `${searchstring}.json`);

    url.search = new URLSearchParams({
      access_token: `${ENV.MAPBOX_ACCESS_TOKEN}`,
      limit: "4",
    }).toString();

    var requestOptions: RequestInit = {
      method: "GET",
      redirect: "follow",
    };

    fetch(url, requestOptions)
      .then((response) => response.json())
      // .then(data => {console.log(data)})
      .then((data) => {
        if (data.features.length === 0) {
          setSearchResultsLocation([]);
        } else {
          data.features.forEach((feature: any) => {
            feature.type = "location";
          });
          setSearchResultsLocation(data.features);
        }
      })
      .catch((error) => console.log("error", error));
  }

  /**
   * One of the functions that is called when the user types in the search bar. It returns the search results for devices, retrived from the device list. The device list is proviided by the database in the /explore route and passed down to the search component.
   *
   * @param searchString string to search for devices in the device list
   */
  function getDevices(searchString: string) {
    var results: any[] = [];
    var deviceResults = 0;

    for (let index = 0; index < props.devices.features.length; index++) {
      const device = props.devices.features[index];
      if (deviceResults === 4) {
        setSearchResultsDevice(results);
        return;
      }
      if (
        device.properties.name
          .toLowerCase()
          .includes(searchString.toLowerCase()) ||
        device.properties.id.toLowerCase().includes(searchString.toLowerCase())
      ) {
        var newStructured = {
          display_name: device.properties.name,
          deviceId: device.properties.id,
          lng: device.properties.longitude,
          lat: device.properties.latitude,
          type: "device"
        };
        results.push(newStructured);
        deviceResults++;
        setSearchResultsDevice(results);
      }
      if (deviceResults === 0) {
        setSearchResultsDevice([]);
      }
    }
  }

  /**
   * onchange handler for the search bar. It sets the search string to the value of the search bar.
   *
   * @param event
   */
  const onChangeHandler = (event: any) => {
    event.preventDefault();
    setSearchString(event.target.value);
  };

  /**
   * useEffect hook that is called when the search string changes. It calls the getLocations and getDevices functions to get the search results for locations and devices.
   */
  useEffect(() => {
    if (searchString.length >= 2) {
      getLocations(searchString);
      getDevices(searchString);
    }
    if (searchString.length < 2) {
      setSearchResultsLocation([]);
      setSearchResultsDevice([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchString]);

  // useEffect(() => {
  //   // setSearchResultsDeviceIndex(searchResultsDevice.length === 0 ? 0 : )
  // })

  /**
   * on click handler for the reset button. It resets the search string and hides the search bar.
   */
  const handleResetClick = () => {
    if (searchString !== "") {
      setSearchString("");
    } else {
      props.setShowSearch(false);
    }
  };

  return (
    <div>
      <div className="flex">
        <input
          ref={props.searchRef}
          type="search"
          className="w-full rounded-full border-none focus:ring-0"
          placeholder="Suche..."
          onChange={onChangeHandler}
          value={searchString}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
              event.preventDefault();
            }
            if (event.key === "Escape") {
              props.setShowSearch(false);
            }
            if (event.key === "k" && event.ctrlKey) {
              event.preventDefault();
              props.setShowSearch(false);
            }
          } }
        />
        <button
          className="top-[10px] right-[10px] mr-1 inline-flex items-center justify-center"
          onClick={() => handleResetClick()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="mx-auto h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="flex justify-around my-2">
        <div className="text-sm text-gray-500 text-center">
          <p>Press <kbd>Ctrl</kbd> + <kbd>k</kbd> or <kbd>Esc</kbd> to close the search.</p>
        </div>
        <div className="text-sm text-gray-500 text-center">
          <p>Press <kbd>Ctrl</kbd> + <kbd>1</kbd> , <kbd>2</kbd> , ... to select a search result.</p>
        </div>
      </div>
      {searchResultsLocation.length > 0 || searchResultsDevice.length > 0 ? (
        <SearchList
          searchResultsLocation={searchResultsLocation}
          searchResultsDevice={searchResultsDevice}
          setShowSearch={props.setShowSearch}
        />
      ) : null}
    </div>
  );
}
