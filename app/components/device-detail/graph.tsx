import { useLoaderData, useNavigation } from "@remix-run/react";
import {
  Chart as ChartJS,
  LineElement,
  TimeScale,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip as ChartTooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { de, enGB } from "date-fns/locale";
import type { LastMeasurementProps } from "./device-detail-box";
import type { loader } from "~/routes/explore/$deviceId";
import { useMemo, useRef, useState } from "react";
import { saveAs } from "file-saver";
import Spinner from "../spinner";
import { Download, X } from "lucide-react";
import DatePickerGraph from "./date-picker-graph";
import type { DraggableData } from "react-draggable";
import Draggable from "react-draggable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { datesHave48HourRange } from "~/lib/utils";
import FixedTimeRangeButtons from "./fixed-time-range-buttons";
import { isBrowser, isTablet } from "react-device-detect";
import { useTheme } from "~/utils/theme-provider";

// Registering Chart.js components that will be used in the graph
ChartJS.register(
  LineElement,
  TimeScale,
  CategoryScale,
  LinearScale,
  PointElement,
  ChartTooltip,
  Legend
);

export default function Graph(props: any) {
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [offsetPositionX, setOffsetPositionX] = useState(0);
  const [offsetPositionY, setOffsetPositionY] = useState(0);

  const nodeRef = useRef(null);
  const chartRef = useRef<ChartJS<"line">>(null);

  // get theme from tailwind
  const [theme] = useTheme();

  // Formatting the data for the Line component
  const lineData = useMemo(() => {
    return {
      labels: loaderData.selectedSensors[0].data.map(
        (measurement: LastMeasurementProps) => measurement.time
      ),
      datasets:
        loaderData.selectedSensors.length === 2
          ? [
              {
                label: loaderData.selectedSensors[0].title,
                data: loaderData.selectedSensors[0].data,
                pointRadius: 0,
                borderColor: loaderData.selectedSensors[0].color,
                backgroundColor: loaderData.selectedSensors[0].color,
                yAxisID: "y",
              },
              {
                label: loaderData.selectedSensors[1].title,
                data: loaderData.selectedSensors[1].data,
                pointRadius: 0,
                borderColor: loaderData.selectedSensors[1].color,
                backgroundColor: loaderData.selectedSensors[1].color,
                yAxisID: "y1",
              },
            ]
          : [
              {
                label: loaderData.selectedSensors[0].title,
                data: loaderData.selectedSensors[0].data,
                pointRadius: 0,
                borderColor: loaderData.selectedSensors[0].color,
                backgroundColor: loaderData.selectedSensors[0].color,
                yAxisID: "y",
              },
            ],
    };
  }, [loaderData.selectedSensors]);

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
        xAxisKey: "time",
        yAxisKey: "value",
      },
      scales: {
        x: {
          type: "time",
          time: {
            // display hour when timerange < 1 day and day when timerange > 1 day
            unit: datesHave48HourRange(
              new Date(loaderData.fromDate),
              new Date(loaderData.toDate)
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
    };
  }, [
    loaderData.fromDate,
    loaderData.toDate,
    loaderData.locale,
    loaderData.selectedSensors,
  ]);

  function handlePngDownloadClick() {
    if (chartRef.current) {
      if (chartRef.current === null) return;
      // why is chartRef.current always never???
      const imageString = chartRef.current.canvas.toDataURL("image/png", 1.0);
      saveAs(imageString, "chart.png");
    }
  }

  function handleCsvDownloadClick() {
    const labels = lineData.labels;
    const dataset = lineData.datasets[0];

    // header
    let csvContent = "timestamp,deviceId,sensorId,value,unit,phenomena";
    csvContent += "\n";
    for (let i = 0; i < labels.length; i++) {
      // timestamp
      csvContent += `${labels[i]},`;
      // deviceId
      csvContent += `${loaderData.selectedSensors[0].deviceId},`;
      // sensorId
      csvContent += `${dataset?.data[i]?.sensorId},`;
      // value
      csvContent += `${dataset?.data[i]?.value},`;
      // unit
      csvContent += `${loaderData.selectedSensors[0].unit},`;
      // phenomenon
      csvContent += `${loaderData.selectedSensors[0].title}`;
      // new line
      csvContent += "\n";
    }

    // Creating a Blob and saving it as a CSV file
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
            className="shadow-zinc-800/5 ring-zinc-900/5 absolute bottom-6 left-4 right-4 top-14 z-40 flex w-auto flex-col gap-4 rounded-xl bg-white px-4 pt-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95 dark:ring-white dark:backdrop-blur-sm md:bottom-[30px] md:left-[calc(33vw+20px)] md:right-auto md:top-auto md:h-[35%] md:max-h-[35%] md:w-[calc(100vw-(33vw+30px))]"
          >
            {navigation.state === "loading" && (
              <div className="bg-gray-100/30 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                <Spinner />
              </div>
            )}
            <div
              className="flex cursor-move items-center justify-between px-2 pt-2"
              id="graphTop"
            >
              <div className="flex items-center justify-center gap-4">
                <DatePickerGraph />
                <FixedTimeRangeButtons />
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
                  onClick={() => props.setOpenGraph(false)}
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
                <Line data={lineData} options={options} ref={chartRef}></Line>
              )}
            </div>
          </div>
        </Draggable>
      )}
    </>
  );
}
