import { useState, useEffect, useCallback } from "react";
import { useMap } from "react-map-gl";
import { useNavigate, useSearchParams } from "@remix-run/react";

import {
  CpuChipIcon,
  GlobeEuropeAfricaIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

import SearchListItem from "./search-list-item";
import { goTo } from "~/lib/search-map-helper";

interface SearchListProps {
  searchResultsLocation: any[];
  searchResultsDevice: any[];
  setShowSearch: (data: boolean) => void;
}

export default function SearchList(props: SearchListProps) {
  const { osem } = useMap();
  const navigate = useNavigate();

  const useKeyPress = function (targetKey: string) {
    const [keyPressed, setKeyPressed] = useState(false);

    useEffect(() => {
      const downHandler = ({ key }: { key: string }) => {
        if (key === targetKey) {
          setKeyPressed(true);
        }
      };

      const upHandler = ({ key }: { key: string }) => {
        if (key === targetKey) {
          setKeyPressed(false);
        }
      };

      window.addEventListener("keydown", downHandler);
      window.addEventListener("keyup", upHandler);

      return () => {
        window.removeEventListener("keydown", downHandler);
        window.removeEventListener("keyup", upHandler);
      };
    }, [targetKey]);

    return keyPressed;
  };

  const downPress = useKeyPress("ArrowDown");
  const upPress = useKeyPress("ArrowUp");
  const enterPress = useKeyPress("Enter");
  const controlPress = useKeyPress("Control");
  const [cursor, setCursor] = useState(0);

  var searchResultsDeviceIndex = -1;
  var searchResultsLocationIndex = props.searchResultsDevice.length - 1;
  var length =
    props.searchResultsDevice.length + props.searchResultsLocation.length;
  var searchResultsAll = props.searchResultsDevice.concat(
    props.searchResultsLocation
  );
  const [selected, setSelected] = useState(searchResultsAll[cursor]);

  const [searchParams] = useSearchParams();
  const [navigateTo, setNavigateTo] = useState(
    (selected.type === "device"
      ? `/explore/${selected.deviceId}`
      : "/explore") +
      // @ts-ignore
      (searchParams.size > 0 ? "?" + searchParams.toString() : "")
  );

  useEffect(() => {
    setSelected(searchResultsAll[cursor]);
  }, [cursor, searchResultsAll]);

  useEffect(() => {
    if (selected.type === "device") {
      // @ts-ignore
      setNavigateTo(`/explore/${selected.deviceId}` + (searchParams.size > 0 ? "?" + searchParams.toString() : ""));
    } else if (selected.type === "location") {
      // @ts-ignore
      setNavigateTo("/explore" + (searchParams.size > 0 ? "?" + searchParams.toString() : ""));
    }
    // console.log(navigateTo);
  }, [selected, searchParams, navigateTo]);

  const setShowSearchCallback = useCallback((state: boolean) => {
    props.setShowSearch(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (length !== 0 && downPress) {
      setCursor((prevState) => (prevState < length - 1 ? prevState + 1 : 0));
    }
  }, [downPress, length]);
  useEffect(() => {
    if (length !== 0 && upPress) {
      setCursor((prevState) => (prevState > 0 ? prevState - 1 : length - 1));
    }
  }, [upPress, length]);
  useEffect(() => {
    if (length !== 0 && enterPress) {
      goTo(osem, selected);
      setShowSearchCallback(false);
      navigate(navigateTo);
    }
  }, [
    enterPress,
    length,
    osem,
    navigate,
    selected,
    setShowSearchCallback,
    navigateTo,
  ]);

  const handleDigitPress = (event: any) => {
    if (
      typeof Number(event.key) === "number" &&
      Number(event.key) <= length &&
      event.ctrlKey
    ) {
      event.preventDefault();
      setCursor(Number(event.key) - 1);
      goTo(osem, selected);
      setTimeout(() => {setShowSearchCallback(false); navigate(navigateTo);}, 500);
      
    }
  };

  useEffect(() => {
    // attach the event listener
    window.addEventListener("keydown", handleDigitPress);

    // remove the event listener
    return () => {
      window.removeEventListener("keydown", handleDigitPress);
    };
  });

  return (
    <div className="w-full overflow-visible rounded-[1.25rem] bg-white pb-2">
      {props.searchResultsDevice.length > 0 ? (
        <hr className="solid mx-2 mb-2 border-t-2" />
      ) : null}
      {props.searchResultsDevice.map((device: any) => {
        searchResultsDeviceIndex++;
        return (
          <SearchListItem
            key={device.deviceId}
            index={searchResultsDeviceIndex}
            active={searchResultsDeviceIndex === cursor}
            type="device"
            item={device}
            icon={CpuChipIcon}
            setShowSearch={props.setShowSearch}
            setCursor={setCursor}
            controlPress={controlPress}
          />
        );
      })}
      {props.searchResultsLocation.length > 0 ? (
        <hr className="solid m-2 border-t-2" />
      ) : null}
      {props.searchResultsLocation.map((location: any) => {
        searchResultsLocationIndex++;
        return (
          <SearchListItem
            key={location.id}
            index={searchResultsLocationIndex}
            active={searchResultsLocationIndex === cursor}
            type="location"
            item={location}
            icon={
              location.place_type.includes("country")
                ? GlobeEuropeAfricaIcon
                : MapPinIcon
            }
            setShowSearch={props.setShowSearch}
            setCursor={setCursor}
            controlPress={controlPress}
          />
        );
      })}
    </div>
  );
}
