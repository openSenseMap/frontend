import {
  useLoaderData,
  useMatches,
  useNavigate,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import {
  Chart as ChartJS,
  LineElement,
  TimeScale,
  CategoryScale,
  LinearScale,
  PointElement,
  //Legend,
  Tooltip as ChartTooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { de } from "date-fns/locale";
import type { LastMeasurementProps } from "./device-detail-box";
import type { loader } from "~/routes/explore/$deviceId";
import { useMemo, useRef, useState } from "react";
import { saveAs } from "file-saver";
import Spinner from "../spinner";
import { Download, Minus, X } from "lucide-react";
import DatePickerGraph from "./date-picker-graph";
import type { DraggableData } from "react-draggable";
import Draggable from "react-draggable";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// Registering Chart.js components that will be used in the graph
ChartJS.register(
  LineElement,
  TimeScale,
  CategoryScale,
  LinearScale,
  PointElement,
  ChartTooltip
  //Legend
);

export default function Graph(props: any) {
  // access env variable on client side
  const loaderData = useLoaderData<typeof loader>();
  console.log("🚀 ~ file: graph.tsx:56 ~ Graph ~ loaderData:", loaderData)
  const navigation = useNavigation();
  const [offsetPositionX, setOffsetPositionX] = useState(0);
  const [offsetPositionY, setOffsetPositionY] = useState(0);

  // form submission handler
  const submit = useSubmit();
  let [searchParams] = useSearchParams();

  const nodeRef = useRef(null);
  const chartRef = useRef<ChartJS<"line">>(null);

  let matches = useMatches();
  let navigate = useNavigate();
  const routeChange = (newPath: string) => {
    let path = newPath;
    navigate(path);
  };

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
            unit: "hour",
          },
          adapters: {
            date: {
              // TODO: get preffered langunage from user object
              locale: de,
            },
          },
          ticks: {
            maxTicksLimit: 5,
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
  }, [loaderData.selectedSensors]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lineChartBackground = {
    id: "lineChartBackground",
    beforeDatasetDraw(chart: ChartJS<"line">) {
      const {
        ctx,
        chartArea: { top, left, width, height },
      } = chart;

      ctx.save();
      ctx.fillStyle = "white";
      ctx.fillRect(left, top, width, height);
    },
  };

  function handleDownloadClick() {
    if (chartRef.current) {
      if (chartRef.current === null) return;
      // why is chartRef.current always never???
      const imageString = chartRef.current.canvas.toDataURL("image/png", 1.0);
      saveAs(imageString, "chart.png");
    }
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
        >
          <div
            ref={nodeRef}
            className="shadow-zinc-800/5 ring-zinc-900/5 absolute bottom-28 left-4 right-4 top-6 z-40 flex w-auto flex-col gap-4 rounded-xl bg-white px-4 pt-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 sm:bottom-[30px] sm:left-[calc(33vw+20px)] sm:right-auto sm:top-auto sm:h-[35%] sm:max-h-[35%] sm:w-[calc(100vw-(33vw+30px))]"
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
              <div className="flex gap-2">
                <DatePickerGraph />
                <Select
                  value={loaderData.aggregation}
                  onValueChange={(value) => {
                    searchParams.set("aggregation", value);
                    submit(searchParams);
                  }}
                >
                  <SelectTrigger className="w-[210px]">
                    <SelectValue placeholder="Select a time aggregate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Time aggregate</SelectLabel>
                      <SelectItem value="raw">Raw</SelectItem>
                      <SelectItem value="15m">15 minutes</SelectItem>
                      <SelectItem value="1d">1 day</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-end gap-4">
                <button
                  onClick={handleDownloadClick}
                  className="inline-flex items-center justify-center"
                >
                  <Download />
                </button>
                <Minus
                  className="cursor-pointer"
                  onClick={() => props.setOpenGraph(false)}
                />
                <X
                  className="cursor-pointer"
                  onClick={() =>
                    // TODO: fix this
                    routeChange("/explore/" + matches[0].params.deviceId)
                  }
                />
              </div>
            </div>
            <div className="flex h-full w-full justify-center bg-white">
              <Line
                data={lineData}
                options={options}
                ref={chartRef}
                // activate this to set the chart backgroundColor but then the reference lines dissapear
                // plugins={[lineChartBackground]}
              ></Line>
            </div>
          </div>
        </Draggable>
      )}
    </>
  );
}
