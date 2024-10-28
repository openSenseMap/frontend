import { useNavigate, useNavigation, useSearchParams } from "@remix-run/react";
import {
  Chart as ChartJS,
  LineElement,
  TimeScale,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip as ChartTooltip,
  Filler,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
// import { de, enGB } from "date-fns/locale";
import { useMemo, useRef, useState, useEffect } from "react";
import { Download, RefreshCcw, X } from "lucide-react";
import type { DraggableData } from "react-draggable";
import Draggable from "react-draggable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { datesHave48HourRange } from "~/lib/utils";
import { isBrowser, isTablet } from "react-device-detect";
import { useTheme } from "remix-themes";
import { AggregationFilter } from "../aggregation-filter";
import { DateRangeFilter } from "../daterange-filter";
import Spinner from "../spinner";
import { ClientOnly } from "../client-only";
import { ColorPicker } from "../color-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

ChartJS.register(
  LineElement,
  TimeScale,
  CategoryScale,
  LinearScale,
  PointElement,
  ChartTooltip,
  Legend,
  Filler,
);

// ClientOnly component to handle the plugin that needs window
const LineWithZoom = (props: any) => {
  useMemo(() => {
    // Dynamically import the zoom plugin
    import("chartjs-plugin-zoom").then(({ default: zoomPlugin }) => {
      ChartJS.register(zoomPlugin);
    });
  }, []);

  return (
    <Line
      data={props.lineData}
      options={props.options}
      ref={props.chartRef}
    ></Line>
  );
};

interface GraphProps {
  aggregation: string;
  sensors: any[];
  startDate?: string;
  endDate?: string;
}

export default function Graph({
  aggregation,
  sensors,
  startDate,
  endDate,
}: GraphProps) {
  const navigation = useNavigation();
  console.log("🚀 ~ navigation:", navigation)
  const navigate = useNavigate();
  const [offsetPositionX, setOffsetPositionX] = useState(0);
  const [offsetPositionY, setOffsetPositionY] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false); // State to track zoom
  const [searchParams, setSearchParams] = useSearchParams();
  const [colorPickerState, setColorPickerState] = useState({
    open: false,
    index: 0,
    color: "#000000",
  });
  const isAggregated = aggregation !== "raw";

  const nodeRef = useRef(null);
  const chartRef = useRef<ChartJS<"line">>(null); // Define chartRef here

  // get theme from tailwind
  const [theme] = useTheme();

  const [lineData, setLineData] = useState(() => {
    const includeDeviceName =
      sensors.length === 2 && sensors[0].device_name !== sensors[1].device_name;

    return {
      datasets: sensors
        .map(
          (
            sensor: {
              title: any;
              device_name: any;
              data: any[];
              color: string;
            },
            index: number,
          ) => {
            const baseDataset = {
              label: includeDeviceName
                ? `${sensor.title} (${sensor.device_name})`
                : sensor.title,
              data: sensor.data.map((measurement) => ({
                x: measurement.time,
                y: measurement.value,
              })),
              pointRadius: 0,
              borderColor: sensor.color,
              backgroundColor: sensor.color,
              yAxisID: index === 0 ? "y" : "y1",
              fill: false,
              tension: 0.4,
            };

            if (isAggregated && sensors.length === 1) {
              const minDataset = {
                ...baseDataset,
                label: `${baseDataset.label} (Min)`,
                data: sensor.data.map((measurement) => ({
                  x: measurement.time,
                  y: measurement.min_value,
                })),
                borderColor: sensor.color + "33",
                backgroundColor: sensor.color + "33",
                fill: 1,
              };

              const maxDataset = {
                ...baseDataset,
                label: `${baseDataset.label} (Max)`,
                data: sensor.data.map((measurement) => ({
                  x: measurement.time,
                  y: measurement.max_value,
                })),
                borderColor: sensor.color + "33",
                backgroundColor: sensor.color + "33",
                fill: 1,
              };

              return [maxDataset, baseDataset, minDataset];
            }

            return [baseDataset];
          },
        )
        .flat(),
    };
  });

  useEffect(() => {
    const includeDeviceName =
      sensors.length === 2 && sensors[0].device_name !== sensors[1].device_name;

    setLineData({
      datasets: sensors
        .map(
          (
            sensor: {
              title: any;
              device_name: any;
              data: any[];
              color: string;
            },
            index: number,
          ) => {
            const baseDataset = {
              label: includeDeviceName
                ? `${sensor.title} (${sensor.device_name})`
                : sensor.title,
              data: sensor.data.map((measurement) => ({
                x: measurement.time,
                y: measurement.value,
              })),
              pointRadius: 0,
              borderColor: sensor.color,
              backgroundColor: sensor.color,
              yAxisID: index === 0 ? "y" : "y1",
              fill: false,
              tension: 0.4,
            };

            if (isAggregated && sensors.length === 1) {
              const minDataset = {
                ...baseDataset,
                label: `${baseDataset.label} (Min)`,
                data: sensor.data.map((measurement) => ({
                  x: measurement.time,
                  y: measurement.min_value,
                })),
                borderColor: sensor.color + "33",
                backgroundColor: sensor.color + "33",
                fill: 1,
              };

              const maxDataset = {
                ...baseDataset,
                label: `${baseDataset.label} (Max)`,
                data: sensor.data.map((measurement) => ({
                  x: measurement.time,
                  y: measurement.max_value,
                })),
                borderColor: sensor.color + "33",
                backgroundColor: sensor.color + "33",
                fill: 1,
              };

              return [maxDataset, baseDataset, minDataset];
            }

            return [baseDataset];
          },
        )
        .flat(),
    });
  }, [sensors, isAggregated]);

  const options: ChartOptions<"line"> = useMemo(() => {
    return {
      maintainAspectRatio: false,
      responsive: true,
      spanGaps: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      parsing: {
        xAxisKey: "x",
        yAxisKey: "y",
      },
      scales: {
        x: {
          type: "time",
          time: {
            unit: datesHave48HourRange(
              startDate ? new Date(startDate) : new Date(),
              endDate ? new Date(endDate) : new Date(),
            )
              ? "hour"
              : "day",
            displayFormats: {
              day: "dd.MM.yyyy",
              millisecond: "mm:ss",
              second: "mm:ss",
              minute: "HH:mm",
              hour: "HH:mm",
            },
            tooltipFormat: "dd.MM.yyyy HH:mm",
          },
          // adapters: {
          //   date: {
          //     locale: data.locale === "de" ? de : enGB,
          //   },
          // },
          ticks: {
            major: {
              enabled: true,
            },
            font: (context) => {
              if (context.tick && context.tick.major) {
                return {
                  weight: "bold",
                };
              }
            },
            maxTicksLimit: 8,
          },
          grid: {
            color:
              theme === "dark" ? "rgba(255, 255, 255)" : "rgba(0, 0, 0, 0.1)",
            borderColor:
              theme === "dark" ? "rgba(255, 255, 255)" : "rgba(0, 0, 0, 0.1)",
          },
        },
        y: {
          title: {
            display: true,
            text: sensors[0].title + " in " + sensors[0].unit,
          },
          type: "linear",
          display: true,
          position: "left",
          grid: {
            color:
              theme === "dark" ? "rgba(255, 255, 255)" : "rgba(0, 0, 0, 0.1)",
            borderColor:
              theme === "dark" ? "rgba(255, 255, 255)" : "rgba(0, 0, 0, 0.1)",
          },
        },
        y1: {
          title: {
            display: true,
            text: sensors[1] ? sensors[1].title + " in " + sensors[1].unit : "", //data.sensors[1].unit
          },
          type: "linear",
          display: "auto",
          position: "right",
          grid: {
            drawOnChartArea: false,
          },
        },
      },
      plugins: {
        zoom: {
          pan: {
            enabled: true,
            mode: "xy",
            onPan: () => setIsZoomed(true), // Mark zoom as active
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: "xy",
            onZoom: () => setIsZoomed(true), // Mark zoom as active
          },
        },
        legend: {
          display: true,
          position: "bottom",
          onHover: (e, legendItem, legend) => {
            const canvas = legend.chart.canvas; // Access the chart from the legend context

            // Only change the cursor and add the tooltip when hovering over the color box
            if (legendItem.fillStyle) {
              canvas.style.cursor = "pointer";
              canvas.title = "Click to change color"; // Tooltip on legend color box
            }
          },
          onLeave: (e, legendItem, legend) => {
            const canvas = legend.chart.canvas;
            canvas.style.cursor = "default";
            canvas.title = ""; // Remove tooltip on leave
          },

          onClick: (e, legendItem, legend) => {
            const index = legendItem.datasetIndex ?? 0;
            setColorPickerState({
              open: !colorPickerState.open,
              index,
              color: lineData.datasets[index].borderColor as string,
            });
          },
          labels: {
            usePointStyle: true,
          },
        },
      },
    };
  }, [
    startDate,
    endDate,
    // data.locale,
    sensors,
    theme,
    colorPickerState.open,
    lineData.datasets,
  ]);

  function handleColorChange(newColor: string) {
    const updatedDatasets = [...lineData.datasets];
    updatedDatasets[colorPickerState.index].borderColor = newColor;
    updatedDatasets[colorPickerState.index].backgroundColor = newColor;

    // Update the lineData state with the new dataset colors
    setLineData((prevData) => ({
      ...prevData,
      datasets: updatedDatasets,
    }));
  }

  function handlePngDownloadClick() {
    if (chartRef.current) {
      const imageString = chartRef.current.canvas.toDataURL("image/png", 1.0);

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = imageString; // Set the href to the data URL
      link.download = "chart.png"; // Specify the download file name

      // Append the link to the document body
      document.body.appendChild(link);

      // Programmatically click the link to trigger the download
      link.click();

      // Clean up and remove the link from the document
      document.body.removeChild(link);
    }
  }

  function handleCsvDownloadClick() {
    const labels = lineData.datasets[0].data.map((point: any) => point.x);

    let csvContent = "timestamp,deviceId,sensorId,value,unit,phenomena\n";

    // Loop through each timestamp and sensor data
    labels.forEach((timestamp: any, index: string | number) => {
      sensors.forEach((sensor: any) => {
        const dataset = lineData.datasets.find(
          (ds: { label: string | any[] }) => ds.label.includes(sensor.title),
        );
        if (dataset) {
          const value = (dataset.data as any)[index]?.y ?? "";

          csvContent += `${timestamp},`;
          csvContent += `${sensor.deviceId},`;
          csvContent += `${sensor.id},`;
          csvContent += `${value},`;
          csvContent += `${sensor.unit},`;
          csvContent += `${sensor.title}\n`;
        }
      });
    });

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a temporary link element
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob); // Create a URL for the Blob

    link.href = url; // Set the href to the Blob URL
    link.download = "chart_data.csv"; // Specify the download file name

    // Append the link to the document body
    document.body.appendChild(link);

    // Programmatically click the link to trigger the download
    link.click();

    // Clean up and remove the link from the document
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the URL object
  }

  function handleResetZoomClick() {
    if (chartRef.current) {
      chartRef.current.resetZoom(); // Use the resetZoom function from the zoom plugin
      setIsZoomed(false); // Reset zoom state
    }
  }

  function handleDrag(_e: any, data: DraggableData) {
    setOffsetPositionX(data.x);
    setOffsetPositionY(data.y);
  }

  return (
    <>
      <Draggable
        nodeRef={nodeRef}
        bounds="#osem"
        handle="#graphTop"
        defaultPosition={{ x: offsetPositionX, y: offsetPositionY }}
        onDrag={handleDrag}
        disabled={!isBrowser && !isTablet}
      >
        <div
          ref={nodeRef}
          className="shadow-zinc-800/5 ring-zinc-900/5 absolute bottom-6 right-4 top-14 z-40 flex flex-col gap-4 rounded-xl bg-white px-4 pt-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95 dark:ring-white dark:backdrop-blur-sm md:bottom-[30px] md:right-4 md:left-auto md:top-auto md:w-[60vw] md:h-[35%] md:max-h-[35%]"
        >
          {navigation.state === "loading" && (
            <div className="bg-gray-100/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[1.5px]">
              <Spinner />
            </div>
          )}
          <div
            className="flex cursor-move items-center justify-between px-2 pt-2"
            id="graphTop"
          >
            <div className="flex items-center justify-center gap-4">
              <DateRangeFilter />
              <AggregationFilter />
            </div>
            <div className="flex items-center justify-end gap-4">
              {isZoomed && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <RefreshCcw
                        onClick={handleResetZoomClick}
                        className="cursor-pointer"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset zoom</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Download />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handlePngDownloadClick}>
                    PNG
                  </DropdownMenuItem>
                  {sensors.length < 2 && (
                    <DropdownMenuItem onClick={handleCsvDownloadClick}>
                      CSV
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <X
                className="cursor-pointer"
                onClick={() => {
                  searchParams.delete("sensor");
                  searchParams.delete("date_to");
                  searchParams.delete("date_from");
                  searchParams.delete("aggregation");
                  setSearchParams(searchParams);
                }}
              />
            </div>
          </div>
          <div className="flex h-full w-full items-center justify-center">
            {(sensors[0].data.length === 0 && sensors[1] === undefined) ||
            (sensors[0].data.length === 0 && sensors[1].data.length === 0) ? (
              <div>There is no data for the selected time period.</div>
            ) : (
              <ClientOnly fallback={<Spinner />}>
                {() => (
                  <LineWithZoom
                    lineData={lineData}
                    options={options}
                    chartRef={chartRef} // Pass chartRef as a prop
                  />
                )}
              </ClientOnly>
            )}
          </div>
          {/* Overlay when the color picker is open */}
          {colorPickerState.open && (
            <>
              <div className="absolute inset-0 z-50 bg-black opacity-50"></div>{" "}
              {/* This is the overlay */}
              <div
                className="absolute z-50 bg-white rounded dark:bg-zinc-800"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)", // Centers the color picker
                }}
              >
                <ColorPicker
                  handleColorChange={handleColorChange}
                  colorPickerState={colorPickerState}
                  setColorPickerState={setColorPickerState}
                />
              </div>
            </>
          )}
        </div>
      </Draggable>
    </>
  );
}
