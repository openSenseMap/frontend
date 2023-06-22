import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";

interface LegendProps {
  title: string;
  values: number[];
  positions: string[];
  colors: string[];
}

export default function Legend({
  title,
  values,
  colors,
  positions,
}: LegendProps) {
  const [isOpen, setIsOpen] = useState(true);
  if (title === "all" || title === "") {
    return null;
  }

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="item-1"
      onValueChange={() => setIsOpen(!isOpen)}
      className="absolute left-0 bottom-[15%] z-10 w-1/5 rounded-lg bg-white p-4 shadow"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>{isOpen ? title : "Legende"}</AccordionTrigger>
        <AccordionContent>
          <div className="mx-5">
            <div className="relative h-[3.625rem]">
              {values.map((v, i) => {
                return (
                  <div
                    key={i}
                    className={`absolute ${positions[i]} top-0 -ml-4 flex h-12 flex-col items-center`}
                  >
                    <svg
                      viewBox="0 0 32 34"
                      className={`w-8 flex-none fill-${colors[i]} drop-shadow`}
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
                      {v}
                    </div>
                  </div>
                );
              })}
              {/* <div className="absolute left-[5%] top-0 -ml-4 flex h-12 flex-col items-center">
                <svg
                  viewBox="0 0 32 34"
                  className={`w-8 flex-none fill-${colors[0]} drop-shadow`}
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
                  {values[4]}
                </div>
              </div>
              <div className="absolute left-[30%] top-0 -ml-4 flex h-12 flex-col items-center">
                <svg
                  viewBox="0 0 32 34"
                  className="w-8 flex-none fill-yellow-500 drop-shadow"
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
                  {values[3]}
                </div>
              </div>
              <div className="absolute left-[50%] top-0 -mr-4 flex h-12 flex-col items-center">
                <svg
                  viewBox="0 0 32 34"
                  className="w-8 flex-none fill-blue-100 drop-shadow"
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
                  {values[2]}
                </div>
              </div>
              <div className="absolute right-[25%] top-0 -mr-4 flex h-12 flex-col items-center">
                <svg
                  viewBox="0 0 32 34"
                  className="w-8 flex-none fill-blue-700 drop-shadow"
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
                  {values[1]}
                </div>
              </div>
              <div className="absolute right-[10%] top-0 -mr-4 flex h-12 flex-col items-center">
                <svg
                  viewBox="0 0 32 34"
                  className="w-8 flex-none fill-violet-500 drop-shadow"
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
                  {values[0]}
                </div>
              </div> */}
            </div>
          </div>
          <div className="flex flex-wrap">
            {/* prettier-ignore */}
            <div className={`w-1/3 h-5 bg-gradient-to-r from-${colors[0]} from-10% via-${colors[1]} via-20% to-${colors[2]} to-90%`}></div>
            <div
              className={`from-10% via-20% to-90% h-5 w-2/3 bg-gradient-to-r from-${colors[3]} via-${colors[4]} to-${colors[5]}`}
            ></div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
