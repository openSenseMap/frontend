import {
  json,
  type LoaderArgs,
  redirect,
  type LinksFunction,
} from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { getUser, getUserSession, sessionStorage } from "~/session.server";
import qs from "qs";
import { useSpinDelay } from "spin-delay";
import clsx from "clsx";
import { getPhenomena } from "~/models/phenomena.server";

import Stepper from "react-stepper-horizontal";
import { MapProvider } from "react-map-gl";
import mapboxgl from "mapbox-gl/dist/mapbox-gl.css";

import General from "~/components/device/new/general";
import SelectDevice from "~/components/device/new/select-device";
import SelectSensors from "~/components/device/new/select-sensors";
import Advanced from "~/components/device/new/advanced";
import SelectLocation from "~/components/device/new/select-location";
import Summary from "~/components/device/new/summary";
import { createDevice } from "~/models/device.server";
import { getUserId } from "~/session.server";
import { useTranslation } from "react-i18next";

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const session = await getUserSession(request);

  if (page === 1) {
    const data =
      {
        ...session.get(`form-data-page-1`),
      } ?? {};

    var getAllDevicesUrl: URL = new URL(
      process.env.SENSORWIKI_API_URL + "devices"
    );

    const response = await fetch(getAllDevicesUrl.toString());
    const devices = await response.json();
    // const sensorsSorted = sensors.sort((a: Sensor, b: Sensor) => {
    //   return a.slug.localeCompare(b.slug);
    // });

    return json({ page, data, devices });
  } else if (page === 3) {
    const data =
      {
        ...session.get(`form-data-page-1`),
        ...session.get(`form-data-page-${page}`),
      } ?? {};

    const type = data.type;

    var getSensorsOfDeviceUrl: URL = new URL(
      process.env.SENSORWIKI_API_URL +
        (type !== "own_device" ? `devices/${type}/sensors` : `sensors`)
    );

    const response = await fetch(getSensorsOfDeviceUrl.toString());
    const sensors = await response.json();
    const phenomena = await getPhenomena();

    let groupedSensors: any = {};
    for (let sensor of sensors) {
      for (let sensorElement of sensor.elements) {
        if (groupedSensors[sensorElement.phenomenonId]) {
          groupedSensors[sensorElement.phenomenonId].push({
            ...sensorElement,
            sensor: sensor,
          });
        } else {
          groupedSensors[sensorElement.phenomenonId] = [
            { ...sensorElement, sensor: sensor },
          ];
        }
      }
    }
    // const sensorsSorted = sensors.sort((a: Sensor, b: Sensor) => {
    //   return a.slug.localeCompare(b.slug);
    // });

    return json({ page, data, groupedSensors: groupedSensors, phenomena });
  } else if (page < 4) {
    const data = session.get(`form-data-page-${page}`) ?? {};
    return json({ page, data });
  } else {
    // final page so just collect all the data to render
    const phenomena = await getPhenomena();

    const data = {
      ...session.get(`form-data-page-1`),
      ...session.get(`form-data-page-2`),
      ...session.get(`form-data-page-3`),
      ...session.get(`form-data-page-4`),
      ...session.get(`form-data-page-5`),
    };
    return json({ page, data, phenomena });
  }
};

export const action = async ({ request }: LoaderArgs) => {
  const text = await request.text();
  const userId = await getUserId(request);

  // use qs.parse to support multi-value values (by email checkbox list)
  const { page, action, ...data } = qs.parse(text);

  if (action === "next" || action === "previous") {
    const session = await getUserSession(request);
    session.set(`form-data-page-${page}`, data);

    const nextPage = Number(page) + (action === "next" ? 1 : -1);
    return redirect(`?page=${nextPage}`, {
      headers: {
        "set-cookie": await sessionStorage.commitSession(session),
      },
    });
  }

  if (action === "submit") {
    const session = await getUserSession(request);
    // session.set(`form-data-page-${page}`, data);

    const finalData = {
      ...session.get(`form-data-page-1`),
      ...session.get(`form-data-page-2`),
      ...session.get(`form-data-page-3`),
      ...session.get(`form-data-page-4`),
      ...session.get(`form-data-page-5`),
    };

    const newDevice = await createDevice(finalData, userId);

    session.flash("global_message", "You successfully added your device!");
    return redirect(`/explore/${newDevice.id}`, {
      headers: {
        "set-cookie": await sessionStorage.commitSession(session),
      },
    });
  }
};

//*****************************************
//* required to view mapbox proberly (Y.Q.)
export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: mapboxgl,
    },
  ];
};

export default function NewDevice() {
  const navigation = useNavigation();
  const { t } = useTranslation("newdevice");

  const showSpinner = useSpinDelay(navigation.state !== "idle", {
    delay: 200,
    minDuration: 300,
  });

  const loaderData = useLoaderData();
  const page = Number(loaderData.page);
  const data = loaderData.data;

  return (
    <div className="container">
      <Form method="post">
        <input name="page" type="hidden" value={page} />
        <Stepper
          steps={[
            { title: "Select Device" },
            { title: "General" },
            { title: "Select Sensors" },
            { title: "Advanced" },
            { title: "Select Location" },
            { title: "Summary" },
          ]}
          activeStep={page - 1}
        />
        <div className="flex justify-between pt-5">
          <div className="flex items-center gap-1">
            <h1 className="text-2xl font-bold">{t("add_device")}</h1>
            <Spinner visible={showSpinner} />
          </div>
          <div className="flex justify-end">
            {page > 1 && (
              <button
                name="action"
                // type="button"
                value="previous"
                formNoValidate
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                {t("prev")}
              </button>
            )}
            {page < 6 && (
              <button
                name="action"
                // type="button"
                value="next"
                className="ml-3 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                {t("next")}
              </button>
            )}
            {page === 6 && (
              <button
                name="action"
                type="submit"
                value="submit"
                className="ml-3 rounded-md border border-gray-300 bg-green-300 px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                {t("submit")}
              </button>
            )}
          </div>
        </div>
        <div className="space-y-8 divide-y divide-gray-200 sm:space-y-5">
          {page === 1 && <SelectDevice data={loaderData} />}
          {page === 2 && <General data={data} />}
          {page === 3 && <SelectSensors data={loaderData} />}
          {page === 4 && <Advanced data={data} />}
          {page === 5 && (
            <MapProvider>
              <SelectLocation data={loaderData} />
            </MapProvider>
          )}

          {page === 6 && (
            <Summary data={data} phenomena={loaderData.phenomena}></Summary>
          )}
        </div>
        <div className="flex justify-end">
          {page > 1 && (
            <button
              name="action"
              // type="button"
              value="previous"
              formNoValidate
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              {t("prev")}
            </button>
          )}
          {page < 6 && (
            <button
              name="action"
              // type="button"
              value="next"
              className="ml-3 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              {t("next")}
            </button>
          )}
          {page === 6 && (
            <button
              name="action"
              type="submit"
              value="submit"
              className="ml-3 rounded-md border border-gray-300 bg-green-300 px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              {t("submit")}
            </button>
          )}
        </div>
      </Form>
    </div>
  );
}

function Spinner({ visible }: { visible: boolean }) {
  return (
    <SpinnerIcon
      className={clsx("animate-spin transition-opacity", {
        "opacity-0": !visible,
        "opacity-100": visible,
      })}
    />
  );
}

export function SpinnerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={24} height={24} fill="none" {...props}>
      <path
        d="M12 4.75v1.5M17.127 6.873l-1.061 1.061M19.25 12h-1.5M17.127 17.127l-1.061-1.061M12 17.75v1.5M7.934 16.066l-1.06 1.06M6.25 12h-1.5M7.934 7.934l-1.06-1.06"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
