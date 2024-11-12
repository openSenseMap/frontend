import {
  redirect,
  type LinksFunction,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import { getUserSession, sessionStorage, getUserId } from "~/session.server";
import qs from "qs";
import { useSpinDelay } from "spin-delay";
import { getPhenomena } from "~/models/phenomena.server";

import * as z from "zod";
import { zfd } from "zod-form-data";
import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm } from "remix-validated-form";

import { MapProvider } from "react-map-gl";
import mapboxgl from "mapbox-gl/dist/mapbox-gl.css?url";
import mapboxglgeocoder from "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css?url";

import General from "~/components/device/new/general";
import SelectDevice from "~/components/device/new/select-device";
import SelectSensors from "~/components/device/new/select-sensors";
import Advanced from "~/components/device/new/advanced";
import SelectLocation from "~/components/device/new/select-location";
import Summary from "~/components/device/new/summary";
import { createDevice } from "~/models/device.server";
import { useTranslation } from "react-i18next";
import Stepper from "~/components/stepper";
import { useEffect, useState } from "react";
import Spinner from "~/components/spinner";

// validator for the form
export const validator: any = {
  ///////////////////
  // select device //
  ///////////////////
  1: withZod(
    z.object({
      type: zfd.text(
        z.string({ required_error: "Please select a device type" }),
      ),
    }),
  ),

  /////////////
  // general //
  /////////////
  2: withZod(
    z.object({
      name: zfd.text(
        z.string().min(3, {
          message: "Name must be at least 3 characters long.",
        }),
      ),

      exposure: z.enum(["INDOOR", "OUTDOOR", "MOBILE"]),

      groupId: zfd.text(
        z
          .union([z.string().length(0), z.string().min(3)])
          .optional()
          .transform((e) => (e === "" ? undefined : e)),
      ),
    }),
  ),

  ////////////////////
  // select sensors //
  ////////////////////
  3: withZod(
    z.object({
      sensors: z.object(
        {},
        {
          errorMap: (issue, ctx) => {
            switch (issue.code) {
              default:
                return { message: "Please select at least one sensor." };
            }
          },
        },
      ),
    }),
  ),

  //////////////
  // advanced //
  //////////////
  4: withZod(
    z.object({
      // ttn
      ttn: z
        .object({
          // enabled: zfd.checkbox({ trueValue: "on" }),

          appId: zfd.text(
            z.string().min(1, {
              message: "Please enter a valid App ID.",
            }),
          ),

          devId: zfd.text(
            z.string().min(1, {
              message: "Please enter a valid Device ID.",
            }),
          ),

          decodeProfile: zfd.text(z.string().min(1)),

          decodeOptions: zfd.text(
            z
              .string()
              .min(1, {
                message: "Please enter valid decoding options",
              })
              .optional(),
          ),

          port: zfd.numeric(z.number().optional()),
        })
        .optional(),

      // mqtt
      mqtt: z
        .object({
          // enabled: zfd.checkbox({ trueValue: "on" }),

          url: zfd.text(
            z.string().url({
              message: "Please enter a valid URL.",
            }),
          ),

          topic: zfd.text(
            z.string().min(1, {
              message: "Please enter a valid topic.",
            }),
          ),

          messageFormat: z.enum(["json", "csv"], {
            errorMap: (issue, ctx) => {
              return { message: "Please select your device type." };
            },
          }),

          decodeOptions: zfd.text(
            z.string().min(1, {
              message: "Please enter valid decode options.",
            }),
          ),

          connectOptions: zfd.text(
            z.string().min(1, {
              message: "Please enter valid connect options.",
            }),
          ),
        })
        .optional(),
    }),
  ),

  ////////////////////
  // select sensors //
  ////////////////////
  5: withZod(
    z.object({
      latitude: zfd.numeric(z.number().min(-90).max(90)),

      longitude: zfd.numeric(z.number().min(-180).max(180)),

      height: zfd.numeric(z.number().min(-200).max(10000)),
    }),
  ),

  6: withZod(z.object({})),
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const session = await getUserSession(request);

  if (page === 1) {
    const data = {
      ...session.get(`form-data-page-1`),
    };

    var getAllDevicesUrl: URL = new URL(
      process.env.SENSORWIKI_API_URL + "devices",
    );

    const response = await fetch(getAllDevicesUrl.toString());
    const devices = await response.json();
    // const sensorsSorted = sensors.sort((a: Sensor, b: Sensor) => {
    //   return a.slug.localeCompare(b.slug);
    // });

    return { page, data, devices, phenomena: null };
  } else if (page === 3) {
    const data = {
      ...session.get(`form-data-page-1`),
      ...session.get(`form-data-page-${page}`),
    };

    const type = data.type;

    var getSensorsOfDeviceUrl: URL = new URL(
      process.env.SENSORWIKI_API_URL +
        (type !== "own_device" ? `devices/${type}/sensors` : `sensors`),
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

    return { page, data, groupedSensors: groupedSensors, phenomena };
  } else if (page < 4) {
    const data = session.get(`form-data-page-${page}`) ?? {};
    return { page, data, phenomena: null };
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
    return { page, data, phenomena };
  }
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  const text = await request.text();
  const userId = await getUserId(request);

  // use qs.parse to support multi-value values (by email checkbox list)
  const { page, action, ...data } = qs.parse(text);

  if (
    (action === "next" ||
      action === "previous" ||
      typeof Number(action) === "number") &&
    action != "submit"
  ) {
    const session = await getUserSession(request);
    session.set(`form-data-page-${page}`, data);

    const pageToNumber = Number(page);
    const nextPage =
      action === "next"
        ? pageToNumber + 1
        : action === "previous"
          ? pageToNumber - 1
          : Number(action);
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
    return redirect(`/explore/${newDevice[0].id}`, {
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
    {
      rel: "stylesheet",
      href: mapboxglgeocoder,
    },
  ];
};

export default function NewDevice() {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { t } = useTranslation("newdevice");

  const showSpinner = useSpinDelay(navigation.state !== "idle", {
    delay: 200,
    minDuration: 300,
  });

  const [activatedSteps, setActivatedSteps] = useState<number[]>([]);

  const loaderData = useLoaderData<typeof loader>();
  const page = Number(loaderData.page);
  const data = loaderData.data;

  function selectStep(index: number) {
    navigate("/device/new?page=" + index);
  }

  useEffect(() => {
    if (!activatedSteps.includes(page)) {
      setActivatedSteps([...activatedSteps, page]);
    }
  }, [page, activatedSteps]);

  return (
    <div className="container">
      <ValidatedForm
        id="new-device-form"
        method="post"
        validator={validator[`${page}`]}
        noValidate
        // defaultValues={{
        //   deviceType: undefined,
        //   general: {
        //     name: "",
        //     exposure: "unknown",
        //     groupId: "",
        //   },
        //   mqtt: {
        //     enabled: false,
        //     url: "",
        //     topic: "",
        //     messageFormat: "json",
        //     decodeOptions: "",
        //     connectionOptions: "",
        //   },
        //   ttn: {
        //     enabled: false,
        //     app_id: "",
        //     dev_id: "",
        //   },
        // }}
        // onSubmit={(e) => {
        //   toast({
        //     description: "You subbmitted the form!",
        //   });
        //   setTabValue("device");
        //   props.setIsAddDeviceDialogOpen(false);
        // }}
        // className="space-y-8"
      >
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
          setStep={selectStep}
          activatedSteps={activatedSteps}
        />
        <div className="flex justify-between pt-5">
          <div className="flex items-center gap-1">
            <h1 className="text-2xl font-bold">{t("select_device")}</h1>
            {showSpinner && (
              <div className="bg-white/30 dark:bg-zinc-800/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                <Spinner />
              </div>
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
        <div className="flex justify-between py-8">
          {/* fake Element to not break layout */}
          {page === 1 && <div className="opacity-0"></div>}
          {page > 1 && (
            <button
              name="action"
              value="previous"
              onClick={(e) => {
                const previousPage = Number(page) - 1;
                navigate(`?page=${previousPage}`);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:text-dark-text"
            >
              {t("prev")}
            </button>
          )}
          {page < 6 && (
            <button
              name="action"
              value="next"
              className="ml-3 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:text-dark-text"
            >
              {t("next")}
            </button>
          )}
          {page === 6 && (
            <button
              name="action"
              type="submit"
              value="submit"
              className="ml-3 rounded-md border border-gray-300 bg-light-green dark:bg-dark-green px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              {t("submit")}
            </button>
          )}
        </div>
      </ValidatedForm>
    </div>
  );
}
