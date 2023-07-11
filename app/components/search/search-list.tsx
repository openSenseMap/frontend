import { useState, useEffect, useCallback, useContext } from "react";
import { useMap } from "react-map-gl";
import { useNavigate, useSearchParams } from "@remix-run/react";

import {
  CpuChipIcon,
  GlobeEuropeAfricaIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

import SearchListItem from "./search-list-item";
import { goTo } from "~/lib/search-map-helper";
import useKeyboardNav from "../header/nav-bar/use-keyboard-nav";
import { NavbarContext } from "../header/nav-bar";

interface SearchListProps {
  searchResultsLocation: any[];
  searchResultsDevice: any[];
}

export default function SearchList(props: SearchListProps) {
  const { osem } = useMap();
  const navigate = useNavigate();
  const { setOpen } = useContext(NavbarContext);

  const { cursor, setCursor, enterPress, controlPress } = useKeyboardNav(
    0,
    0,
    props.searchResultsDevice.length + props.searchResultsLocation.length
  );

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
      setNavigateTo(
        `/explore/${selected.deviceId}` +
          (searchParams.size > 0 ? "?" + searchParams.toString() : "")
      );
    } else if (selected.type === "location") {
      // @ts-ignore
      setNavigateTo(
        "/explore" +
          (searchParams.size > 0 ? "?" + searchParams.toString() : "")
      );
    }
    console.log(navigateTo);
  }, [selected, searchParams, navigateTo]);

  const setShowSearchCallback = useCallback(
    (state: boolean) => {
      setOpen(state);
    },
    [setOpen]
  );

  useEffect(() => {
    if (length !== 0 && enterPress) {
      goTo(osem, selected);
      setShowSearchCallback(false);
      navigate(navigateTo);
    }
  }, [
    enterPress,
    osem,
    navigate,
    selected,
    setShowSearchCallback,
    navigateTo,
    length,
  ]);

  const handleDigitPress = (event: any) => {
    if (
      typeof Number(event.key) === "number" &&
      Number(event.key) <= length &&
      controlPress
    ) {
      event.preventDefault();
      setCursor(Number(event.key) - 1);
      goTo(osem, selected);
      setTimeout(() => {
        setShowSearchCallback(false);
        navigate(navigateTo);
      }, 500);
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
      {props.searchResultsDevice.length > 0 && (
        <hr className="solid mx-2 mb-2 border-t-2" />
      )}
      {props.searchResultsDevice.map((device: any, i) => (
        <SearchListItem
          key={device.deviceId}
          index={i}
          active={i === cursor}
          name={device.display_name}
          icon={CpuChipIcon}
          controlPress={controlPress}
          onMouseEnter={() => setCursor(i)}
          onClick={() => {
            goTo(osem, device);
            setShowSearchCallback(false);
            navigate(navigateTo);
          }}
        />
      ))}
      {props.searchResultsLocation.length > 0 && (
        <hr className="solid m-2 border-t-2" />
      )}
      {props.searchResultsLocation.map((location: any, i) => {
        return (
          <SearchListItem
            key={location.id}
            index={i + props.searchResultsDevice.length}
            active={i + props.searchResultsDevice.length === cursor}
            name={location.place_name}
            icon={
              location.place_type.includes("country")
                ? GlobeEuropeAfricaIcon
                : MapPinIcon
            }
            controlPress={controlPress}
            onMouseEnter={() => setCursor(i + props.searchResultsDevice.length)}
            onClick={() => {
              goTo(osem, location);
              setShowSearchCallback(false);
              navigate(navigateTo);
            }}
          />
        );
      })}
    </div>
  );
}
