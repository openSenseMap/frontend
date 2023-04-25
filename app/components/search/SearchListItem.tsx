// import type { LngLatBounds, LngLatLike } from "react-map-gl";
import { useNavigate } from "@remix-run/react";
import { useMap } from "react-map-gl";

import { goTo } from "~/lib/searchMapHelper";

interface SearchListItemProps {
  index: number;
  active: boolean;
  type: String;
  item: any;
  icon: any;
  setShowSearch: (data: boolean) => void;
  setCursor: (data: number) => void;
  controlPress: boolean;
}

export default function SearchListItem(props: SearchListItemProps) {
  const navigate = useNavigate();
  const { osem } = useMap();

  // console.log(props.index)

  return (
    <div
      className="data-[active=false]:bg-white z-50 mx-2 flex data-[active=true]:bg-green-200"
      onClick={() => {
        goTo(osem, props.item);
        props.setShowSearch(false);
        navigate(
          props.type === "device"
            ? `/explore/${props.item.deviceId}`
            : "/explore"
        );
      }}
      data-active={props.active}
      onMouseEnter={() => {
        props.setCursor(props.index);
      }}
    >
      {props.controlPress ? (
        <div className="w-6 text-center">
          <kbd>
            {props.index + 1}
          </kbd>
        </div>
      ) : null}
      <props.icon className="h-6 w-6" />
      <div className="pl-2">
        {props.type === "device"
          ? props.item.display_name
          : props.item.place_name}
      </div>
    </div>
  );
}
