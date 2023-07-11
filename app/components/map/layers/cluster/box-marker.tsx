import type { Device } from "@prisma/client";
import { Exposure } from "@prisma/client";
import { useNavigate } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Rocket } from "lucide-react";
import type { MarkerProps } from "react-map-gl";
import { Marker, useMap } from "react-map-gl";
import { cn } from "~/lib/utils";

interface BoxMarkerProps extends MarkerProps {
  device: Device;
}

const statusColors = {
  ACTIVE: "bg-green-100",
  INACTIVE: "bg-gray-100",
  OLD: "bg-gray-100 opacity-50",
};

export default function BoxMarker({ device, ...props }: BoxMarkerProps) {
  const navigate = useNavigate();
  const { osem } = useMap();

  const isFullZoom = osem && osem?.getZoom() >= 14;

  return (
    <Marker {...props}>
      <AnimatePresence mode="popLayout">
        <motion.div
          className={cn(
            "absolute flex w-fit cursor-pointer items-center rounded-full bg-white p-1 text-sm shadow hover:z-10 hover:shadow-lg",
            isFullZoom ? "-left-4 -top-4" : "-left-[10px] -top-[10px]"
          )}
          onClick={() => navigate(`${device.id}`)}
        >
          <span
            className={cn(
              "relative rounded-full transition-colors",
              isFullZoom && `${statusColors[device.status]} p-1`
            )}
          >
            {device.exposure === Exposure.MOBILE ? (
              <Rocket className="h-4 w-4" />
            ) : (
              <Box className="h-4 w-4" />
            )}
            {isFullZoom && device.status === "ACTIVE" ? (
              <div
                className={cn(
                  "absolute left-0 top-0 h-full w-full animate-ping rounded-full opacity-50",
                  statusColors[device.status]
                )}
              />
            ) : null}
          </span>
          {isFullZoom ? (
            <motion.span
              layoutId={device.id}
              className="max-w-[100px] overflow-hidden overflow-ellipsis whitespace-nowrap px-1"
              initial={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
            >
              {device.name}
            </motion.span>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </Marker>
  );
}
