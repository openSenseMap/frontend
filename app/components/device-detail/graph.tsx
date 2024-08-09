import {
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
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
import { de, enGB } from "date-fns/locale";
import type { MeasurementProps } from "./device-detail-box";
import type { loader } from "~/routes/explore.$deviceId._index";
import { useMemo, useRef, useState } from "react";
import { saveAs } from "file-saver";
import { Download, X } from "lucide-react";
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
import { ColorPicker } from "../color-picker";
import { ClientOnly } from "../client-only";

// Registering Chart.js components that will be used in the graph
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

export default function Graph(props: any) {
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [offsetPositionX, setOffsetPositionX] = useState(0);
  const [offsetPositionY, setOffsetPositionY] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [colorPickerState, setColorPickerState] = useState({
    open: false,
    index: 0,
    color: "#000000",
  });
  const [isAggregated] = useState(loaderData.aggregation !== "raw");

  const nodeRef = useRef(null);
  const chartRef = useRef<ChartJS<"line">>(null); // Define chartRef here

  // get theme from tailwind
  const [theme] = useTheme();

  const [lineData, setLineData] = useState(() => {
    const getLabel = (sensor: any, includeDeviceName: any) => {
      return includeDeviceName
        ? `${sensor.title} (${sensor.device_name})`
        : sensor.title;
    };

    const includeDeviceName =
      loaderData.selectedSensors.length === 2 &&
      loaderData.selectedSensors[0].device_name !==
        loaderData.selectedSensors[1].device_name;

    const datasets = loaderData.selectedSensors.map(
      (sensor: any, index: number) => {
        const baseDataset = {
          label: getLabel(sensor, includeDeviceName),
          data: sensor.data.map((measurement: MeasurementProps) => ({
            x: measurement.time,
            y: measurement.value,
          })),
          pointRadius: 0,
          borderColor: sensor.color,
          backgroundColor: sensor.color,
          yAxisID: index === 0 ? "y" : "y1",
          fill: false,
          tension: 0.4, // Smooth line
        };

        // show ribbon for aggregated data if only one sensor is selected
        if (isAggregated && loaderData.selectedSensors.length === 1) {
          const baseDataset = {
            label: getLabel(sensor, includeDeviceName),
            data: sensor.data.map((measurement: MeasurementProps) => ({
              x: measurement.time,
              y: measurement.value,
            })),
            pointRadius: 0,
            borderColor: sensor.color,
            backgroundColor: sensor.color,
            yAxisID: index === 0 ? "y" : "y1",
            fill: false, // Base line should not fill anything
            tension: 0.4, // Smooth line
          };

          const minDataset = {
            label: `${getLabel(sensor, includeDeviceName)} (Min)`,
            data: sensor.data.map((measurement: MeasurementProps) => ({
              x: measurement.time,
              y: measurement.min_value,
            })),
            borderColor: sensor.color + "33", // Use a visible color for the line
            backgroundColor: sensor.color + "33", // Lighter version by adding opacity
            pointRadius: 0,
            fill: 1, // Fill area between this dataset and the baseDataset
            tension: 0.4,
          };

          const maxDataset = {
            label: `${getLabel(sensor, includeDeviceName)} (Max)`,
            data: sensor.data.map((measurement: MeasurementProps) => ({
              x: measurement.time,
              y: measurement.max_value,
            })),
            borderColor: sensor.color + "33", // Use a visible color for the line
            backgroundColor: sensor.color + "33", // Lighter version by adding opacity
            pointRadius: 0,
            fill: 1, // Fill area from this dataset to the baseDataset
            tension: 0.4,
          };

          return [maxDataset, baseDataset, minDataset];
        }

        return [baseDataset];
      },
    );

    return {
      datasets: datasets.flat(), // Flatten the array to avoid nested arrays
    };
  });

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
              new Date(loaderData.fromDate),
              new Date(loaderData.toDate),
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
          adapters: {
            date: {
              locale: loaderData.locale === "de" ? de : enGB,
            },
          },
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
            text:
              loaderData.selectedSensors[0].title +
              " in " +
              loaderData.selectedSensors[0].unit,
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
            text: loaderData.selectedSensors[1]
              ? loaderData.selectedSensors[1].title +
                " in " +
                loaderData.selectedSensors[1].unit
              : "", //data.sensors[1].unit
          },
          type: "linear",
          display: "auto",
          position: "right",
          // grid line settings
          grid: {
            drawOnChartArea: false, // only want the grid lines for one axis to show up
          },
        },
      },
      plugins: {
        zoom: {
          pan: {
            enabled: true,
            mode: "xy",
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: "xy",
          },
        },
        legend: {
          display: true,
          position: "bottom",
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
    loaderData.fromDate,
    loaderData.toDate,
    loaderData.locale,
    loaderData.selectedSensors,
    theme,
    colorPickerState.open,
    lineData.datasets,
  ]);

  function handleColorChange(newColor: string) {
    const updatedDatasets = [...lineData.datasets];
    updatedDatasets[colorPickerState.index].borderColor = newColor;
    updatedDatasets[colorPickerState.index].backgroundColor = newColor;

    setLineData((prev) => ({
      ...prev,
      datasets: updatedDatasets,
    }));

    setColorPickerState((prev) => ({ ...prev, open: false }));
  }

  function handlePngDownloadClick() {
    if (chartRef.current) {
      if (chartRef.current === null) return;
      const imageString = chartRef.current.canvas.toDataURL("image/png", 1.0);
      saveAs(imageString, "chart.png");
    }
  }

  function handleCsvDownloadClick() {
    const labels = lineData.datasets[0].data.map((point: any) => point.x);

    let csvContent = "timestamp,deviceId,sensorId,value,unit,phenomena\n";

    // Loop through each timestamp and sensor data
    labels.forEach((timestamp: any, index: string | number) => {
      loaderData.selectedSensors.forEach((sensor: any) => {
        // Find the corresponding dataset for this sensor
        const dataset = lineData.datasets.find(
          (ds: { label: string | any[] }) => ds.label.includes(sensor.title),
        );
        if (dataset) {
          const value = dataset.data[index]?.y ?? "";

          // Since sensorId might not be directly in the dataset, ensure we use it from sensor
          csvContent += `${timestamp},`;
          csvContent += `${sensor.deviceId},`;
          csvContent += `${sensor.id},`; // Accessing sensor.sensorId directly
          csvContent += `${value},`;
          csvContent += `${sensor.unit},`;
          csvContent += `${sensor.title}\n`;
        }
      });
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "chart_data.csv");
  }

  function handleDrag(_e: any, data: DraggableData) {
    setOffsetPositionX(data.x);
    setOffsetPositionY(data.y);
  }

  return (
    <>
      {props.openGraph && (
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
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Download />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handlePngDownloadClick}>
                      PNG
                    </DropdownMenuItem>
                    {loaderData.selectedSensors.length < 2 && (
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
                    props.setOpenGraph(false);
                  }}
                />
              </div>
            </div>
            <div className="flex h-full w-full items-center justify-center">
              {(loaderData.selectedSensors[0].data.length === 0 &&
                loaderData.selectedSensors[1] === undefined) ||
              (loaderData.selectedSensors[0].data.length === 0 &&
                loaderData.selectedSensors[1].data.length === 0) ? (
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
              {colorPickerState.open && (
                <div
                  className="absolute z-50 p-2 bg-white rounded dark:bg-zinc-800"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)", // Centers the color picker
                  }}
                >
                  <ColorPicker
                    currentColor={colorPickerState.color}
                    setColor={handleColorChange}
                  />
                </div>
              )}
            </div>
          </div>
        </Draggable>
      )}
    </>
  );
}
