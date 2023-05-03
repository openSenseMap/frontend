import { useLoaderData, useParams, useSearchParams } from "@remix-run/react";
import {
  Chart as ChartJS,
  LineElement,
  TimeScale,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { de } from "date-fns/locale";
import type { LastMeasurementProps } from "./BottomBar";
import { loader } from "~/routes/explore/$deviceId";

// Registering Chart.js components that will be used in the graph
ChartJS.register(
  LineElement,
  TimeScale,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function Graph(data: any) {
  // access env variable on client side
  const loaderData = useLoaderData<typeof loader>();
  // Initializing state variables using the useState hook
  //const [status, setStatus] = useState(""); //use for loading animation?
  const [sensorData1, setSensorData1] = useState([]);
  const [sensorData2, setSensorData2] = useState([]);
  const [searchParams] = useSearchParams();
  const sensorIds = searchParams.getAll("sensorId");

  // Getting URL parameters using the useParams hook
  const params = useParams();

  // Fetching data from the API and updating state variables using the useEffect hook
  useEffect(() => {
    //setStatus("Loading");

    // TODO: move this to model and fetch from DB when measurements are stored there
    // Fetching data for the first sensor
    fetch(
      loaderData.OSEM_API_URL +
        "/boxes/" +
        params.deviceId +
        "/data/" +
        sensorIds[0] +
        "?from-date=" +
        new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString() + //24 hours ago
        "&to-date=" +
        new Date().toISOString()
    )
      .then((response) => response.json())
      .then((data) => {
        setSensorData1(data);
      });
    //.then(() => setStatus("Success"))
    //.catch(() => setStatus("Error"));

    // Fetching data for the second sensor (if applicable)
    if (sensorIds.length > 1) {
      //setStatus("Loading");
      fetch(
        loaderData.OSEM_API_URL +
          "/boxes/" +
          params.deviceId +
          "/data/" +
          sensorIds[1] +
          "?from-date=" +
          new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString() + //24 hours ago
          "&to-date=" +
          new Date().toISOString()
      )
        .then((response) => response.json())
        .then((data) => {
          setSensorData2(data);
        });
      //.then(() => setStatus("Success"))
      //.catch(() => setStatus("Error"));
    }
  }, [data.sensors, params.deviceId, sensorIds]);

  // Formatting the data for the Line component
  const lineData = {
    labels: sensorData1.map(
      (measurement: LastMeasurementProps) => measurement.createdAt
    ),
    datasets:
      data.sensors.length === 2
        ? [
            {
              label: data.sensors[0].title,
              data: sensorData1,
              pointRadius: 0,
              borderColor: "blue",
              backgroundColor: "blue",
              yAxisID: "y",
            },
            {
              label: data.sensors[1].title,
              data: sensorData2,
              pointRadius: 0,
              borderColor: "red",
              backgroundColor: "red",
              yAxisID: "y1",
            },
          ]
        : [
            {
              label: data.sensors[0].title,
              data: sensorData1,
              pointRadius: 0,
              borderColor: "blue",
              backgroundColor: "blue",
              yAxisID: "y",
            },
          ],
  };

  const options: ChartOptions = {
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
          text: data.sensors[0].title + " in " + data.sensors[0].unit,
        },
        type: "linear",
        display: true,
        position: "left",
      },
      y1: {
        title: {
          display: true,
          text: data.sensors[1]
            ? data.sensors[1].title + " in " + data.sensors[1].unit
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
    <div className="flex h-full w-full justify-center px-10">
      {/* 
// @ts-ignore */}
      <Line data={lineData} options={options}></Line>
    </div>
  );
}
