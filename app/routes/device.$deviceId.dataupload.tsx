import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { useState } from "react";
import { getUserId } from "~/session.server";
import { ArrowLeft, Upload } from "lucide-react";
import { Input } from "~/components/ui/input";
import Home from "~/components/header/home";

//*****************************************************
export async function loader({ request, params }: LoaderArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  return json({});
}

//*****************************************************
export async function action({ request }: ActionArgs) {
  return json({});
}

//**********************************
export default function DataUpload() {
  const [measurementData, setMeasurementData] = useState("");
  const [dataFormat, setDataFormat] = useState("CSV");

  return (
    <div>
      <div className="pointer-events-none z-10 mb-10 flex h-14 w-full p-2">
        <Home />
      </div>

      <div className="mx-8 mr-20 mt-14">
        <div className="grid grid-cols-8 gap-10 font-helvetica text-[15px] tracking-wide max-md:grid-cols-2 lg:grid-rows-1">
          <nav className="col-span-2 md:col-span-2">
            <ul>
              <li className="rounded p-3 text-[#676767] hover:bg-[#eee]">
                <ArrowLeft className=" mr-2 inline h-5 w-5" />
                <Link to="/profile/me">Back to Dashboard</Link>
              </li>
            </ul>
          </nav>

          <main className="col-span-6 md:col-span-6">
            <div className="grid grid-rows-1">
              <div className="flex min-h-full items-center justify-center">
                <div className="mx-auto w-full font-helvetica text-[14px]">
                  {/* Form */}
                  <Form method="post" noValidate>
                    {/* Heading */}
                    <div>
                      {/* Title */}
                      <div className="mt-2 flex justify-between">
                        <div>
                          <h1 className=" text-4xl">Manual Data Upload</h1>
                        </div>
                      </div>
                    </div>

                    {/* divider */}
                    <hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

                    <div className="my-5 rounded border border-[#bce8f1] bg-[#d9edf7] p-4 text-[#31708f]">
                      <p>
                        Here you can upload measurements for this senseBox. This
                        can be of use for senseBoxes that log their measurements
                        to a SD-card when no means of direct communication to
                        opensensemap are available. Either select a file, or
                        copy the data into the textfield. Accepted data formats
                        are described{" "}
                        <a
                          href="https://docs.opensensemap.org/#api-Measurements-postNewMeasurements"
                          className="cursor-pointer text-[#4eaf47]"
                        >
                          here
                        </a>
                        .
                      </p>
                    </div>

                    {/* select file button */}
                    <div className="mb-4 mt-6">
                      <label
                        htmlFor="fileInput"
                        className=" cursor-pointer rounded border border-gray-200 px-4 py-2 text-black hover:bg-[#e6e6e6] disabled:border-[#ccc] disabled:text-[#8a8989]"
                      >
                        Select a file
                      </label>
                      <Input
                        type="file"
                        id="fileInput"
                        accept="text/csv,application/json,application/vnd.ms-excel"
                        className="invisible absolute"
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0];
                          if (file) {
                            setDataFormat(file.type);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const fileContent =
                                event.target?.result?.toString();
                              if (fileContent) setMeasurementData(fileContent);
                            };
                            reader.readAsText(file);
                          }
                        }}
                      ></Input>
                    </div>

                    {/* data format */}
                    <div>
                      <label
                        htmlFor="exposure"
                        className="txt-base block font-bold tracking-normal"
                      >
                        Data format
                      </label>

                      <div className="mt-1">
                        <select
                          id="exposure"
                          name="exposure"
                          value={
                            dataFormat === "application/json" ? "JSON" : "CSV"
                          }
                          onChange={(e) => setDataFormat(e.target.value)}
                          className="appearance-auto w-full rounded border border-gray-200 px-2 py-1.5 text-base"
                        >
                          <option value="CSV">CSV</option>
                          <option value="JSON">JSON</option>
                        </select>
                      </div>
                    </div>

                    {/* Measurement data */}
                    <div className="mt-3">
                      <label
                        htmlFor="exposure"
                        className="txt-base block font-bold tracking-normal"
                      >
                        Measurement data
                      </label>

                      <div className="mt-1">
                        <textarea
                          placeholder="sensorID,value,timestamp,longitude,latitude,height"
                          className=" h-[350px] w-full rounded-[1px] border-[#ccc] text-[90%]"
                          defaultValue={measurementData}
                        ></textarea>
                      </div>
                    </div>

                    {/* upload button */}
                    <div className="mt-3">
                      <button
                        type="submit"
                        name="intent"
                        value="delete"
                        className="mb-5 rounded border border-gray-200 px-4 py-2 text-[18px] text-black hover:bg-[#e6e6e6] disabled:border-[#ccc] disabled:text-[#8a8989]"
                      >
                        <Upload className=" mr-1 inline-block h-[20px] w-[19px] align-sub" />{" "}
                        UPLOAD
                      </button>
                    </div>
                  </Form>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
