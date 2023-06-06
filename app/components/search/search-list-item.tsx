// import type { LngLatBounds, LngLatLike } from "react-map-gl";
import { useNavigate } from "@remix-run/react";
import { useMap } from "react-map-gl";

import { goTo } from "~/lib/search-map-helper";

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
      className="z-50 mx-2 my-1 flex h-8 items-center rounded-lg data-[active=false]:bg-white data-[active=true]:bg-green-100"
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
        <div className="w-6 pl-2">
          <kbd>{props.index + 1}</kbd>
        </div>
      ) : null}
      <props.icon className="h-8 w-8 pl-2" />
      <span className="inline-block pl-2 align-middle">
        {props.type === "device"
          ? props.item.display_name
          : props.item.place_name}
      </span>
    </div>
  );
}
