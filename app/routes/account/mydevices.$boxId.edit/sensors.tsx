import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useLoaderData,
} from "@remix-run/react";
import React, { useState } from "react";
import { getUserId } from "~/session.server";
import {
  ClipboardCopy,
  Edit,
  Save,

} from "lucide-react";
import { getSensors } from "~/models/device.server";
import { typedjson } from "remix-typedjson";
import { TrashIcon } from "@heroicons/react/24/outline";

//*****************************************************
export async function loader({ request, params }: LoaderArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  const deviceID = params.boxId;
  if (typeof deviceID !== "string") {
    return json("deviceID not found");
  }
  const sensorsData = await getSensors(deviceID);

  return typedjson(sensorsData);
}

//*****************************************************
export async function action({ request }: ActionArgs) {
  /* ToDo: upadte it to include button clicks inside form */
  return ("");
}

//**********************************
export default function EditBoxSensors() {
  const sensorsData = useLoaderData<typeof loader>();
  /* buttons states */
  const [editBtn, setEditBtn] = useState(false);
  const [deleteBtn, setdeleteBtn] = useState(false);

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
                    type="submit"
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
              {sensorsData?.map((sensor: any) => {
                return (
                  <li
                    key={sensor.id}
                    className=" border-t-[1px] border-solid border-[#e1e4e8] p-4"
                  >
                    <div className="grid grid-cols-12">
                      {/* left side -> sensor attributes */}

                      <div className="col-span-9 border-r-[1px] border-solid border-[#e1e4e8] sm:col-span-8">
                        {/* shown by default */}
                        {!editBtn && (
                          <span className=" table-cell align-middle leading-[1.6]">
                            <strong className=" block">
                              Phenomenon:
                              <span className="text-[#626161]">
                                {sensor?.title}
                              </span>
                            </strong>
                            <strong>ID:</strong>
                            <code className="rounded-sm bg-[#f9f2f4] px-1 py-[2px] text-[#c7254e]">
                              {sensor?.id}
                              {/* ToDo: why not remain in same page */}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(sensor?.id);
                                }}
                              >
                                <ClipboardCopy className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
                              </button>
                            </code>
                            <strong className=" block">
                              Unit:
                              <span className="text-[#626161]">
                                {sensor?.unit}
                              </span>
                            </strong>
                            <strong className=" block">
                              Type:
                              <span className="text-[#626161]">
                                {sensor?.sensorType}
                              </span>
                            </strong>
                          </span>
                        )}

                        {/* shown when edit button clicked */}
                        {editBtn && (
                          <div className="mb-4 pr-4">
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
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* right side -> Save, delete, cancel buttons */}
                      <div className="col-span-3 ml-4 sm:col-span-4">
                        {/* buttons shown by default */}
                        <span className="table-cell align-middle leading-[1.6]">
                          {/* {true && ( */}
                          <span className="bg-[#d9534f] p-[3px] leading-[1.6] text-[#fff]">
                            This sensor will be deleted.
                          </span>
                          {/* )} */}

                          <button
                          onClick={() => {
                            setEditBtn(!editBtn);
                            return false;
                          }}
                            className="mb-1 mt-2 block rounded-[3px] border-[#2e6da4] bg-[#337ab7] px-[5px] py-[3px] pt-1
                          text-[14px] leading-[1.6] text-[#fff]"
                          >
                            <Edit className=" mr-1 inline-block h-[15px] w-[15px] align-sub" />
                            Edit
                          </button>
                          <button
                            className="mb-1 mt-2 block rounded-[3px] border-[#d43f3a;] bg-[#d9534f] px-[5px] py-[3px] pt-1
                          text-[14px] leading-[1.6] text-[#fff]"
                          >
                            <TrashIcon className="mr-1 inline-block h-[17px] w-[16px] align-sub" />
                            Delete
                          </button>
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Form>
        </div>
      </div>
    </div>
  );
}
