import { useLoaderData, useNavigation } from "@remix-run/react";
import {
  Chart as ChartJS,
  LineElement,
  TimeScale,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  //Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { de } from "date-fns/locale";
import type { LastMeasurementProps } from "./device-detail-box";
import type { loader } from "~/routes/explore/$deviceId";
import { useRef, useState } from "react";
import { saveAs } from "file-saver";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import ShareLink from "./share-link";
import Spinner from "../spinner";
import { Download, LineChart, Minus, Share2, X } from "lucide-react";
import DatePickerGraph from "./date-picker-graph";
import type { DraggableData } from "react-draggable";
import Draggable from "react-draggable";
import { getGraphColor } from "~/lib/utils";

// Registering Chart.js components that will be used in the graph
ChartJS.register(
  LineElement,
  TimeScale,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip
  //Legend
);

export default function Graph() {
  // access env variable on client side
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [open, setOpen] = useState(true);
  const [offsetPositionX, setOffsetPositionX] = useState(0);
  const [offsetPositionY, setOffsetPositionY] = useState(0);

  const nodeRef = useRef(null);
  const chartRef = useRef<ChartJS<"line">>(null);

  // Formatting the data for the Line component
  const lineData = {
    labels: loaderData.selectedSensors[0].data.map(
      (measurement: LastMeasurementProps) => measurement.createdAt
    ),
    datasets:
      loaderData.selectedSensors.length === 2
        ? [
            {
              label: loaderData.selectedSensors[0].title,
              data: loaderData.selectedSensors[0].data,
              pointRadius: 0,
              borderColor: getGraphColor(loaderData.selectedSensors[0].unit),
              backgroundColor: getGraphColor(
                loaderData.selectedSensors[0].unit
              ),
              yAxisID: "y",
            },
            {
              label: loaderData.selectedSensors[1].title,
              data: loaderData.selectedSensors[1].data,
              pointRadius: 0,
              borderColor: getGraphColor(loaderData.selectedSensors[1].unit),
              backgroundColor: getGraphColor(
                loaderData.selectedSensors[1].unit
              ),
              yAxisID: "y1",
            },
          ]
        : [
            {
              label: loaderData.selectedSensors[0].title,
              data: loaderData.selectedSensors[0].data,
              pointRadius: 0,
              borderColor: getGraphColor(loaderData.selectedSensors[0].unit),
              backgroundColor: getGraphColor(
                loaderData.selectedSensors[0].unit
              ),
              yAxisID: "y",
            },
          ],
  };

  const options: ChartOptions<"line"> = {
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    parsing: {
      xAxisKey: "createdAt",
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

  function handleDrag(e: any, data: DraggableData) {
    setOffsetPositionX(data.x);
    setOffsetPositionY(data.y);
  }

  return (
    <>
      {open && (
        <Draggable
          nodeRef={nodeRef}
          bounds="#osem"
          handle="#graphTop"
          defaultPosition={{ x: offsetPositionX, y: offsetPositionY }}
          onDrag={handleDrag}
        >
          <div
            ref={nodeRef}
            className="shadow-zinc-800/5 ring-zinc-900/5 absolute bottom-28 left-4 right-4 top-6 z-40 flex w-auto flex-col gap-4 rounded-xl bg-white px-4 pt-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 sm:bottom-[30px] sm:left-[calc(25vw+20px)] sm:right-auto sm:top-auto sm:max-h-[calc(100vh-24rem)] sm:w-[calc(100vw-(25vw+30px))]"
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
              <DatePickerGraph />
              <div className="flex items-center justify-end gap-4">
                <button
                  onClick={handleDownloadClick}
                  className="inline-flex items-center justify-center"
                >
                  <Download />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Share2 className="cursor-pointer" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Share this link</AlertDialogTitle>
                      <ShareLink />
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Minus
                  className="cursor-pointer"
                  onClick={() => setOpen(false)}
                />
                <X className="cursor-pointer" />
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
      {!open && (
        <div
          onClick={() => setOpen(true)}
          className={
            "absolute bottom-28 left-4 right-4 top-6 z-40 flex cursor-pointer rounded-xl bg-white px-4 py-2 shadow-lg ring-1 sm:bottom-[30px] sm:left-[calc(25vw+20px)] sm:right-auto sm:top-auto sm:max-h-[calc(100vh-24rem)]"
          }
        >
          <LineChart />
        </div>
      )}
    </>
  );
}
