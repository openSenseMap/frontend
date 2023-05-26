import { useLoaderData } from "@remix-run/react";
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
import type { LastMeasurementProps } from "./BottomBar";
import type { loader } from "~/routes/explore/$deviceId";

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
              borderColor: "blue",
              backgroundColor: "blue",
              yAxisID: "y",
            },
            {
              label: loaderData.selectedSensors[1].title,
              data: loaderData.selectedSensors[1].data,
              pointRadius: 0,
              borderColor: "red",
              backgroundColor: "red",
              yAxisID: "y1",
            },
          ]
        : [
            {
              label: loaderData.selectedSensors[0].title,
              data: loaderData.selectedSensors[0].data,
              pointRadius: 0,
              borderColor: "blue",
              backgroundColor: "blue",
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

  return (
    <div className="text-gray-100 shadow-inner">
      {loaderData.selectedSensors.length > 0 ? (
        <div className="flex h-full w-full justify-center px-10">
          <Line data={lineData} options={options}></Line>
        </div>
      ) : null}
    </div>
  );
}
