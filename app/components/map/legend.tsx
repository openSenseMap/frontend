import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MutableRefObject, useRef, useState } from "react";
import Draggable, { DraggableData } from "react-draggable";
import { isTablet, isBrowser } from "react-device-detect";

export type LegendValue = {
  value: number;
  color: string;
  position: string;
};

interface LegendProps {
  title: string;
  values: LegendValue[] | null;
}

export default function Legend({ title, values }: LegendProps) {
  const [isOpen, setIsOpen] = useState(true);

  const nodeRef = useRef(null);
  // state variables
  const [offsetPositionX, setOffsetPositionX] = useState(0);
  const [offsetPositionY, setOffsetPositionY] = useState(0);

  function handleDrag(_e: any, data: DraggableData) {
    setOffsetPositionX(data.x);
    setOffsetPositionY(data.y);
  }

  if (title === "all" || title === "") {
    return null;
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x: offsetPositionX, y: offsetPositionY }}
      onDrag={handleDrag}
      bounds="#osem"
      handle="#test"
      disabled={!isBrowser && !isTablet}
    >
      <Accordion
        type="single"
        collapsible
        ref={nodeRef}
        defaultValue="item-1"
        onValueChange={() => setIsOpen(!isOpen)}
        className="absolute bottom-[15%] right-4 z-10 w-1/5 rounded-lg bg-white shadow"
      >
        <AccordionItem value="item-1">
          <AccordionTrigger id="test" className="font-bold capitalize p-4">
            {isOpen ? title : "Legende"}
          </AccordionTrigger>
          <AccordionContent>
            <div className="mx-5 px-4">
              <div className="relative h-[3.625rem]">
                {values?.map((v, i) => {
                  return (
                    <div
                      key={i}
                      className={`absolute top-0 ml-4 flex h-12 flex-col items-center `}
                      style={{
                        right: v.position,
                      }}
                    >
                      <svg
                        viewBox="0 0 32 34"
                        className={`w-8 flex-none drop-shadow`}
                        fill={v.color}
                      >
                        <path d="M1 4a4 4 0 0 1 4-4h22a4 4 0 0 1 4 4v19.6a4 4 0 0 1-2.118 3.53L16 34 3.118 27.13A4 4 0 0 1 1 23.6V4Z" />
                        <path
                          fill="none"
                          stroke="#000"
                          strokeOpacity=".05"
                          d="M5 .5h22A3.5 3.5 0 0 1 30.5 4v19.6a3.5 3.5 0 0 1-1.853 3.088L16 33.433 3.353 26.688A3.5 3.5 0 0 1 1.5 23.6V4A3.5 3.5 0 0 1 5 .5Z"
                        />
                      </svg>
                      <div className="dark:bg-white/30 mt-2 h-2 w-0.5 bg-gray-700"></div>
                      <div className="absolute left-0 top-0 flex h-8 w-full items-center justify-center font-mono text-[0.6875rem] font-semibold">
                        {v.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap px-4">
              {values && (
                <div
                  className="h-5 w-full"
                  style={{
                    background: `-webkit-linear-gradient(45deg, ${values
                      .map((v) => v.color)
                      .join(", ")} )`,
                  }}
                ></div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Draggable>
  );
}
