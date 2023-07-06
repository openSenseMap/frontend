import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import React, { useState } from "react";
import { getUserId } from "~/session.server";
import { ClipboardCopy, Edit, Save, Undo2 } from "lucide-react";
import { getSensors } from "~/models/device.server";
import { typedjson } from "remix-typedjson";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

//*****************************************************
export async function loader({ request, params }: LoaderArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  const deviceID = params.boxId;
  if (typeof deviceID !== "string") {
    return json("deviceID not found");
  }
  const rawSensorsData = await getSensors(deviceID);

  return typedjson(rawSensorsData);
}

//*****************************************************
export async function action({ request }: ActionArgs) {
  //* ToDo: upadte it to include button clicks inside form
  const formData = await request.formData();
  const { updatedSensorsData } = Object.fromEntries(formData);

  if (typeof updatedSensorsData !== "string") {
    return json("deviceID not found");
  }
  const updatedSensorsDataJson = JSON.parse(updatedSensorsData);
  /* console.log(
    "🚀 ~ file: sensors.tsx:41 ~ action ~ formData:",
    JSON.parse(updatedSensorsData)
  ); */

  for (const sensor of updatedSensorsDataJson) {
    if (sensor?.edited === true) {
      console.log("🚀🚀🚀 ~ file: sensors.tsx:43 ~ action ~ edited:");
    } else if (sensor?.new === true) {
      console.log("🚀🚀🚀 ~ file: sensors.tsx:43 ~ action ~ new:");
    } else if (sensor?.deleted === true) {
      console.log("🚀🚀🚀 ~ file: sensors.tsx:43 ~ action ~ deleted:");
    }
  }

  return "";
}

//**********************************
export default function EditBoxSensors() {
  const data = useLoaderData<typeof loader>();
  const [sensorsData, setSensorsData] = useState(data);
  /* temp impl. until figuring out how to updating state of nested objects  */
  const [tepmState, setTepmState] = useState(false);

  return (
    <div className="grid grid-rows-1">
      {/* sensor form */}
      <div className="flex min-h-full items-center justify-center">
        <div className="mx-auto w-full font-helvetica text-[14px]">
          {/* Form */}
          <Form method="post" noValidate>
            {/* Heading */}
            <div>
              {/* Title */}
              <div className="mt-2 flex justify-between">
                <div>
                  <h1 className=" text-4xl">Sensor</h1>
                </div>
                <div>
                  <button
                    // type="submit"
                    name="intent"
                    value="save"
                    /* disabled={
                      name === deviceData?.name &&
                      exposure === deviceData?.exposure
                    } */
                    className=" h-12 w-12 rounded-full border-[1.5px] border-[#9b9494] hover:bg-[#e7e6e6]"
                  >
                    <Save className="mx-auto h-5 w-5 lg:h-7 lg:w-7" />
                  </button>
                </div>
              </div>
            </div>

            {/* divider */}
            <hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

            <div className="my-5 rounded border border-[#faebcc] bg-[#fcf8e3] p-4 text-[#8a6d3b]">
              <p>
                Data measured by sensors that you are going to delete will be
                deleted as well. If you add new sensors, don't forget to
                retrieve your new script (see tab 'Script').
              </p>
            </div>

            <ul className="mt-0 rounded-[3px] border-[1px] border-solid border-[#d1d5da] pt-0">
              {sensorsData?.map((sensor: any, index: number) => {
                return (
                  <li
                    key={sensor.id}
                    className=" border-t-[1px] border-solid border-[#e1e4e8] p-4"
                  >
                    <div className="grid grid-cols-12">
                      {/* left side -> sensor attributes */}

                      <div className="col-span-9 border-r-[1px] border-solid border-[#e1e4e8] sm:col-span-8">
                        {/* shown by default */}
                        {!sensor?.editing && (
                          <span className=" table-cell align-middle leading-[1.75]">
                            <strong className=" block">
                              Phenomenon:
                              <span className="px-1 text-[#626161]">
                                {sensor?.title}
                              </span>
                            </strong>
                            <strong>ID: </strong>
                            <code className="rounded-sm bg-[#f9f2f4] px-1 py-[2px] text-[#c7254e]">
                              {sensor?.id}
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(sensor?.id);
                                }}
                              >
                                <ClipboardCopy className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
                              </button>
                            </code>
                            <strong className=" block">
                              Unit:
                              <span className="px-1 text-[#626161]">
                                {sensor?.unit}
                              </span>
                            </strong>
                            <strong className=" block">
                              Type:
                              <span className="px-1 text-[#626161]">
                                {sensor?.sensorType}
                              </span>
                            </strong>
                          </span>
                        )}

                        {/* shown when edit button clicked */}
                        {sensor?.editing && (
                          <div className="mb-4 pr-4">
                            {/* <form> */}
                            <div className="mb-4">
                              <label
                                htmlFor="phenomenom"
                                className="mb-1 inline-block font-[700]"
                              >
                                Phenomenom:
                              </label>
                              <input
                                type="text"
                                defaultValue={sensor?.title}
                                className="form-control"
                                onChange={(e) => {
                                  sensor.title = e.target.value;
                                }}
                              />
                            </div>
                            <div className="mb-4">
                              <label
                                htmlFor="unit"
                                className="mb-1 inline-block font-[700]"
                              >
                                Unit:
                              </label>
                              <input
                                type="text"
                                defaultValue={sensor?.unit}
                                className="form-control"
                                onChange={(e) => {
                                  sensor.sensorType = e.target.value;
                                }}
                              />
                            </div>
                            <div className="mb-4">
                              <label
                                htmlFor="type"
                                className="mb-1 inline-block font-[700]"
                              >
                                Type
                              </label>
                              <input
                                type="text"
                                defaultValue={sensor?.sensorType}
                                className="form-control"
                                onChange={(e) => {
                                  sensor.unit = e.target.value;
                                }}
                              />
                            </div>
                            {/* </form> */}
                          </div>
                        )}
                      </div>

                      {/* right side -> Save, delete, cancel buttons */}
                      <div className="col-span-3 ml-4 sm:col-span-4">
                        {/* buttons shown by default */}
                        <span className="table-cell align-middle leading-[1.6]">
                          {/* warning text - delete */}
                          {sensor?.deleting && (
                            <span className="bg-[#d9534f] p-[3px] leading-[1.6] text-[#fff]">
                              This sensor will be deleted.
                            </span>
                          )}

                          {/* undo button */}
                          {sensor?.deleting && (
                            <button
                              type="button"
                              onClick={() => {
                                setTepmState(!tepmState);
                                sensor.deleting = false;
                              }}
                              className="mb-1 mt-2 block rounded-[3px] 
                              border-[#2e6da4] bg-[#337ab7] px-[5px] py-[3px] pt-1 text-[14px] leading-[1.6] text-[#fff]
                              hover:border-[#204d74] hover:bg-[#286090]"
                            >
                              <Undo2 className="mr-1 inline-block h-[17px] w-[16px] align-sub" />
                              Undo
                            </button>
                          )}

                          {!sensor?.editing && !sensor?.deleting && (
                            <span>
                              {/* edit button */}
                              {/* ToDo: why onClick not updating the state unless dummy unrelated state is updated */}
                              <button
                                type="button"
                                onClick={() => {
                                  setTepmState(!tepmState);
                                  sensor.editing = true;
                                  // console.log("🚀 ~ file: sensors.tsx:248 ~ {sensorsData?.map ~ sensorsData:", sensorsData);
                                }}
                                className="mb-1 mt-2 block rounded-[3px] 
                                border-[#2e6da4] bg-[#337ab7] px-[5px] py-[3px] pt-1
                                text-[14px] leading-[1.6] text-[#fff] hover:border-[#204d74] hover:bg-[#286090]"
                              >
                                <Edit className="mr-1 inline-block h-[17px] w-[15px] align-sub" />
                                Edit
                              </button>

                              {/* delete button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setTepmState(!tepmState);
                                  sensor.deleting = true;
                                  sensor.deleted = true;
                                  return false;
                                }}
                                className="mb-1 mt-2 block rounded-[3px]
                                border-[#d43f3a] bg-[#d9534f] px-[5px] py-[3px] pt-1 text-[14px] leading-[1.6] text-[#fff]
                                hover:border-[#ac2925] hover:bg-[#c9302c]"
                              >
                                <TrashIcon className="mr-1 inline-block h-[17px] w-[16px] align-sub" />
                                Delete
                              </button>
                            </span>
                          )}
                        </span>

                        {sensor?.editing && (
                          <span className="table-cell h-[222px] align-middle leading-[1.6]">
                            {/* invalid input text */}
                            {sensor?.notValidInput && (
                              <span className="bg-[#d9534f] p-[3px] leading-[1.6] text-[#fff]">
                                Please fill out all required fields.
                              </span>
                            )}

                            {/* save button */}
                            <button
                              type="button"
                              onClick={() => {
                                setTepmState(!tepmState);
                                if (
                                  sensor.title &&
                                  sensor.unit &&
                                  sensor.sensorType
                                ) {
                                  console.log("all valid");
                                  sensor.notValidInput = false;
                                  sensor.editing = false;
                                  sensor.edited = true;
                                } else {
                                  console.log("not all are valid");
                                  sensor.notValidInput = true;
                                }
                              }}
                              className="mb-1 mt-2 block rounded-[3px] 
                                border-[#2e6da4] bg-[#337ab7] px-[5px] py-[3px] pt-1
                                text-[14px] leading-[1.6] text-[#fff] hover:border-[#204d74] hover:bg-[#286090]"
                            >
                              <Save className="mr-1 inline-block h-[17px] w-[15px] align-sub" />
                              Save
                            </button>

                            {/* cancel button */}
                            <button
                              type="button"
                              onClick={() => {
                                setTepmState(!tepmState);
                                sensor.editing = false;
                                //* restore data
                                sensor.title = data[index].title;
                                sensor.unit = data[index].unit;
                                sensor.sensorType = data[index].sensorType;
                              }}
                              className="mb-1 mt-2 block rounded-[3px] 
                                border-[#2e6da4] bg-[#337ab7] px-[5px] py-[3px] pt-1
                                text-[14px] leading-[1.6] text-[#fff] hover:border-[#204d74] hover:bg-[#286090]"
                            >
                              <XMarkIcon className="mr-1 inline-block h-[17px] w-[15px] scale-[1.2] align-sub" />
                              Cancel
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* As there's no way to send data wiht form on submit to action (see: https://github.com/remix-run/react-router/discussions/10264) */}
            <input
              name="updatedSensorsData"
              type="hidden"
              value={JSON.stringify(sensorsData)}
            />
          </Form>
        </div>
      </div>
    </div>
  );
}
