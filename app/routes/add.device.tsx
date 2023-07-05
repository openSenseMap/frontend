import { json, type LoaderArgs, redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { getUserSession, sessionStorage } from "~/session.server";
import qs from "qs";
import { useSpinDelay } from "spin-delay";
import clsx from "clsx";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useState } from "react";

type Sensor = {
  id: number;
  slug: string;
  label: object;
  description: object;
  elements?: object;
  price?: number;
  lifePeriod?: number;
  manufacturer?: string;
  validation?: boolean;
};

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const session = await getUserSession(request);

  if (page === 3) {
    const data =
      {
        ...session.get(`form-data-page-1`),
        ...session.get(`form-data-page-${page}`),
      } ?? {};

    const type = data.type;

    var sensorWikiUrl: URL = new URL(
      ENV.SENSORWIKI_API_URL + (type !== "own_device" ? `devices/device/${type}/sensors` : `sensors/all`)
    );

    const response = await fetch(sensorWikiUrl.toString());
    const sensors = await response.json();
    const sensorsSorted = sensors.sort((a: Sensor, b: Sensor) => {
      return a.slug.localeCompare(b.slug);
    });

    return json({ page, data, sensors: sensorsSorted });
  } else if (page < 4) {
    const data = session.get(`form-data-page-${page}`) ?? {};
    return json({ page, data });
  } else {
    // final page so just collect all the data to render
    const data = {
      ...session.get(`form-data-page-1`),
      ...session.get(`form-data-page-2`),
      ...session.get(`form-data-page-3`),
      // ...session.get(`form-data-page-4`),
    };
    return json({ page, data });
  }
};

export const action = async ({ request }: LoaderArgs) => {
  const text = await request.text();
  // use qs.parse to support multi-value values (by email checkbox list)
  const { page, action, ...data } = qs.parse(text);

  console.log({ page, action, data });

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
      // ...session.get(`form-data-page-4`),
    };

    console.log(finalData);

    session.flash("global_message", "You successfully added your device!");
    return redirect("/explore", {
      headers: {
        "set-cookie": await sessionStorage.commitSession(session),
      },
    });
  }
};

export default function AddDevice() {
  const navigation = useNavigation();
  const showSpinner = useSpinDelay(navigation.state !== "idle", {
    delay: 200,
    minDuration: 300,
  });

  const loaderData = useLoaderData();
  const page = Number(loaderData.page);
  const data = loaderData.data;

  console.log(loaderData.sensors);

  const [deviceType, setDeviceType] = useState(data.type);

  return (
    <div className="container">
      <Form method="post">
        <input name="page" type="hidden" value={page} />
        <div className="flex justify-between pt-5">
          <div className="flex items-center gap-1">
            <h1 className="text-2xl font-bold">Add Device</h1>
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
                Previous
              </button>
            )}
            {page < 4 && (
              <button
                name="action"
                // type="button"
                value="next"
                className="ml-3 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                Next
              </button>
            )}
            {page === 4 && (
              <button
                name="action"
                type="submit"
                value="submit"
                className="ml-3 rounded-md border border-gray-300 bg-green-300 px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                Submit
              </button>
            )}
          </div>
        </div>
        <div className="space-y-8 divide-y divide-gray-200 sm:space-y-5">
          {page === 1 && (
            <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Select Device
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Which hardware do you use?
                </p>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <Card
                  data-checked={deviceType === "sensebox_edu"}
                  onClick={() => setDeviceType("sensebox_edu")}
                  className="data-[checked=true]:ring-2 data-[checked=true]:ring-green-300"
                >
                  <CardContent className="flex justify-center pt-2">
                    <AspectRatio ratio={3 / 4}>
                      {/* <img
                        src="/images/"
                        alt="senseBox:edu"
                        className="rounded-md object-cover"
                      /> */}
                    </AspectRatio>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <CardTitle>senseBox:edu</CardTitle>
                  </CardFooter>
                </Card>

                <Card
                  data-checked={deviceType === "sensebox_home"}
                  onClick={() => setDeviceType("sensebox_home")}
                  className="data-[checked=true]:ring-2 data-[checked=true]:ring-green-300"
                >
                  <CardContent className="flex justify-center pt-2">
                    <AspectRatio ratio={3 / 4}>
                      {/* <img
                        src="/images/"
                        alt="senseBox:home"
                        className="rounded-md object-cover"
                      /> */}
                    </AspectRatio>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <CardTitle>senseBox:home</CardTitle>
                  </CardFooter>
                </Card>

                <Card
                  data-checked={deviceType === "airdatainfo_device"}
                  onClick={() => setDeviceType("airdatainfo_device")}
                  className="data-[checked=true]:ring-2 data-[checked=true]:ring-green-300"
                >
                  <CardContent className="flex justify-center pt-2">
                    <AspectRatio ratio={3 / 4}>
                      {/* <img
                        src="/images/"
                        alt="Luftdaten.info"
                        className="rounded-md object-cover"
                      /> */}
                    </AspectRatio>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <CardTitle>LuftdatenInfo Device</CardTitle>
                  </CardFooter>
                </Card>

                <Card
                  data-checked={deviceType === "own_device"}
                  onClick={() => setDeviceType("own_device")}
                  className="data-[checked=true]:ring-2 data-[checked=true]:ring-green-300"
                >
                  <CardContent className="flex justify-center pt-2">
                    <AspectRatio ratio={3 / 4}>
                      {/* <img
                        src="/images/"
                        alt="own:device"
                        className="rounded-md object-cover"
                      /> */}
                    </AspectRatio>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <CardTitle>Own Device</CardTitle>
                  </CardFooter>
                </Card>
              </div>
              {/* <div className="flex justify-end p-2">
                  <Button
                    type="button"
                    onClick={() => setDeviceType(undefined)}
                  >
                    Reset
                  </Button>
                </div> */}

              {/* <RadioGroup
                id="deviceType"
                name="deviceType"
                value={data.deviceType}
                // onValueChange={(value) => {
                //   setDeviceType(value);
                //   deviceTypeField.validate();
                // }}
                // className="hidden"
              >
                <div>
                  <RadioGroupItem value="senseBox:edu" />
                </div>
                <div>
                  <RadioGroupItem value="senseBox:home" />
                </div>
                <div>
                  <RadioGroupItem value="luftdaten.info" />
                </div>
                <div>
                  <RadioGroupItem value="own:device" />
                </div>
              </RadioGroup> */}

              <div className="mt-4 space-y-4" hidden>
                <div className="flex items-center">
                  <input
                    id="type-sensebox_edu"
                    name="type"
                    value="sensebox_edu"
                    defaultChecked={deviceType === "sensebox_edu"}
                    checked={deviceType === "sensebox_edu"}
                    onChange={() => setDeviceType("sensebox_edu")}
                    type="radio"
                    required
                    className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
                  />
                  <label
                    htmlFor="type-sensebox_edu"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    senseBox:edu
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="type-sensebox_home"
                    name="type"
                    value="sensebox_home"
                    defaultChecked={deviceType === "sensebox_home"}
                    checked={deviceType === "sensebox_home"}
                    onChange={() => setDeviceType("sensebox_home")}
                    type="radio"
                    required
                    className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
                  />
                  <label
                    htmlFor="type-sensebox_home"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    senseBox:home
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="type-airdatainfo_device"
                    name="type"
                    value="airdatainfo_device"
                    defaultChecked={deviceType === "airdatainfo_device"}
                    checked={deviceType === "airdatainfo_device"}
                    onChange={() => setDeviceType("airdatainfo_device")}
                    type="radio"
                    required
                    className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
                  />
                  <label
                    htmlFor="type-airdatainfo_device"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    LuftdatenInfo Device
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="type-own_device"
                    name="type"
                    value="own_device"
                    defaultChecked={deviceType === "own_device"}
                    checked={deviceType === "own_device"}
                    onChange={() => setDeviceType("own_device")}
                    type="radio"
                    required
                    className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
                  />
                  <label
                    htmlFor="type-own_device"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    Own Device
                  </label>
                </div>
              </div>

              <div className="py-2">
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Info</AlertTitle>
                  <AlertDescription>
                    Dein Gerät is nicht in der Liste? Füge es im Sensor-Wiki
                    hinzu, um es auf der openSenseMap zu benutzen: Anleitung
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
          {page === 2 && (
            <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Profile
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  This information will be displayed publicly so be careful what
                  you share.
                </p>
              </div>

              <div className="mt-6 space-y-6 sm:mt-5 sm:space-y-5">
                <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                  >
                    Name of your station
                  </label>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        defaultValue={data.name}
                        autoComplete="name"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                  <div>
                    <div
                      className="text-base font-medium text-gray-900 sm:text-sm sm:text-gray-700"
                      id="label-notifications"
                    >
                      Exposure
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="max-w-lg">
                      <p className="text-sm text-gray-500">
                        This is how your device is exposed/placed.
                      </p>
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center">
                          <input
                            id="exposure-indoor"
                            name="exposure"
                            value="indoor"
                            defaultChecked={data.exposure === "indoor"}
                            type="radio"
                            required
                            className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
                          />
                          <label
                            htmlFor="exposure-indoor"
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            Indoor
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="exposure-outdoor"
                            name="exposure"
                            value="outdoor"
                            defaultChecked={data.exposure === "outdoor"}
                            type="radio"
                            required
                            className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
                          />
                          <label
                            htmlFor="exposure-outdoor"
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            Outdoor
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="exposure-mobile"
                            name="exposure"
                            value="mobile"
                            defaultChecked={data.exposure === "mobile"}
                            type="radio"
                            required
                            className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
                          />
                          <label
                            htmlFor="exposure-mobile"
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            Mobile
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                  >
                    Group ID (optional)
                  </label>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <div className="flex max-w-lg rounded-md shadow-sm">
                      <input
                        type="text"
                        name="groupId"
                        id="groupId"
                        defaultValue={data.groupId}
                        autoComplete="name"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                  <label
                    htmlFor="cover-photo"
                    className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                  >
                    Cover photo
                  </label>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <div className="flex max-w-lg justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pb-6 pt-5">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="text-indigo-600 hover:text-indigo-500 focus-within:ring-indigo-500 relative cursor-pointer rounded-md bg-white font-medium focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="hidden"
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                        <p className="text-xs italic text-gray-500">
                          Not implemented
                        </p>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          )}
          {page === 3 && (
            <div className="space-y-6 divide-y divide-gray-200 pt-8 sm:space-y-5 sm:pt-10">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Sensors
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Select the sensors you want to use.
                </p>
              </div>
              <div className="space-y-6 divide-y divide-gray-200 sm:space-y-5">
                <div className="grid grid-cols-8 gap-4">
                  {loaderData.sensors.map((sensor: Sensor) => {
                    return (
                      <Card
                        // data-checked={}
                        // onClick={}
                        key={sensor.id}
                        className="data-[checked=true]:ring-2 data-[checked=true]:ring-green-300"
                      >
                        <CardContent className="flex justify-center pt-2">
                          <AspectRatio ratio={3 / 4}>
                            {/* <img
                        src="/images/"
                        alt="senseBox:edu"
                        className="rounded-md object-cover"
                      /> */}
                          </AspectRatio>
                        </CardContent>
                        <CardFooter className="flex justify-center">
                          <CardTitle>{sensor.slug}</CardTitle>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
                <pre>{JSON.stringify(loaderData.json, null, 2)}</pre>
              </div>
            </div>
          )}
          {page === 4 && <pre>{JSON.stringify(data, null, 2)}</pre>}
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
