import { useEffect, useState } from "react";
import SearchList from "./search-list";
import { useTranslation, Trans } from "react-i18next";

interface SearchProps {
  searchString: string;
  devices: any;
}

export default function Search(props: SearchProps) {
  let { t } = useTranslation("search");

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
          type: "device",
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
   * useEffect hook that is called when the search string changes. It calls the getLocations and getDevices functions to get the search results for locations and devices.
   */
  useEffect(() => {
    console.log(props.searchString);
    if (props.searchString.length >= 2) {
      getLocations(props.searchString);
      getDevices(props.searchString);
    }
    if (props.searchString.length < 2) {
      setSearchResultsLocation([]);
      setSearchResultsDevice([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.searchString]);

  if (searchResultsLocation.length > 0 || searchResultsDevice.length > 0)
    return (
      <div className="mt-2">
        <SearchList
          searchResultsLocation={searchResultsLocation}
          searchResultsDevice={searchResultsDevice}
        />
        <div className="flex">
          <div className="text-center text-sm text-gray-500">
            <p>
              <Trans
                t={t}
                i18nKey={"hint_select_result"}
                components={[<kbd key="select_result"></kbd>]}
              />
            </p>
          </div>
        </div>
      </div>
    );

  return null;
}
