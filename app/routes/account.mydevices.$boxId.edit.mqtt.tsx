import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { getUserId } from "~/session.server";
import { Save } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import ErrorMessage from "~/components/error-message";

import * as mqtt from "mqtt/dist/mqtt.min";

//*****************************************************
export async function loader({ request, params }: LoaderFunctionArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  return "";
}

//*****************************************************
export async function action({ request, params }: ActionFunctionArgs) {
  console.log("actions");

  const formData = await request.formData();
  const { enableMQTTcb, mqqtURL, mqqtTopic } = Object.fromEntries(formData);

  //* ToDo: if mqtt checkbox is not enabled, reset mqtt to default 
  if (!enableMQTTcb) {
    return json({
      errors: {
        mqqtURL: null,
        mqqtTopic: null,
        reset: true,
      },
      status: 200,
    });
  }

  const errors = {
    mqqtURL: mqqtURL ? null : "Invalid URL (please use ws or wss URL)",
    mqqtTopic: mqqtTopic ? null : "Invalid mqqt topic",
    reset: false,
  };

  return json({
    errors,
    status: 200,
  });
}

//**********************************
export default function EditBoxMQTT() {
  const [mqttEnabled, setMqttEnabled] = useState(false);
  const [mqttURL, setMqttURL] = useState("");
  const [mqttValid, setMqttValid] = useState(true);
  const actionData = useActionData<typeof action>();

  const mqqtURLRef = React.useRef<HTMLInputElement>(null);
  const mqqtTopicRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData) {
      const hasErrors = Object.values(actionData?.errors).some(
        (errorMessage) => errorMessage,
      );

      // ToDo
      if (actionData.errors.reset) {
        // Do nothing for now
      } else if (!hasErrors) {
        let isValidURL = false;
        const client = mqtt
          .connectAsync(mqttURL)
          // .connectAsync("wss://broker.emqx.io:8084/mqtt")
          .then((e) => {
            isValidURL = true;
          });

        setTimeout(() => {
          if (isValidURL) {
            console.log("🚀 MQTT URL is valid");
          } else {
            console.log("🚀 MQTT URL is not valid");
            setMqttValid(false);
            mqqtURLRef.current?.focus();
          }
        }, 1000);
      } else if (hasErrors && actionData?.errors?.mqqtURL) {
        mqqtURLRef.current?.focus();
      } else if (hasErrors && actionData?.errors?.mqqtTopic) {
        mqqtTopicRef.current?.focus();
      }
    }
  }, [actionData]);

  return (
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
                  <h1 className=" text-4xl">MQTT</h1>
                </div>
                <div>
                  {/* Save button */}
                  <button
                    type="submit"
                    name="intent"
                    value="save"
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
                openSenseMap offers a{" "}
                <a
                  href="http://mqtt.org/"
                  className="cursor-pointer text-[#4eaf47]"
                >
                  MQTT{" "}
                </a>{" "}
                client for connecting to public brokers. Documentation for the
                parameters is provided{" "}
                <a
                  href="https://docs.opensensemap.org/#api-Boxes-postNewBox"
                  className="cursor-pointer text-[#4eaf47]"
                >
                  in the docs.{" "}
                </a>
                Please note that it's only possible to receive measurements
                through MQTT.
              </p>
            </div>

            <div className="my-6 flex items-center space-x-2">
              <Checkbox
                name="enableMQTTcb"
                onCheckedChange={() => setMqttEnabled(!mqttEnabled)}
              />
              <label
                htmlFor="terms"
                className="cursor-pointer text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enable MQTT
              </label>
            </div>

            {/* MQTT URL */}
            <div className="my-2">
              <label
                htmlFor="name"
                className="txt-base block font-bold tracking-normal"
              >
                Url*
              </label>

              <div className="mt-1">
                <input
                  id="mqqtURL"
                  required
                  autoFocus={true}
                  name="mqqtURL"
                  type="text"
                  ref={mqqtURLRef}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-base disabled:cursor-not-allowed disabled:bg-[#eee]"
                  disabled={!mqttEnabled}
                  value={mqttURL}
                  onChange={(e) => setMqttURL(e.target.value)}
                />
                {actionData?.errors?.mqqtURL && (
                  <div className="pt-1 text-[#FF0000]" id="mqqtURL-error">
                    {actionData.errors.mqqtURL}
                  </div>
                )}

                {!mqttValid && (
                  <div className="pt-1 text-[#FF0000]" id="mqqtURL-error">
                    Entered mqtt url is not valid, please try again with a valid one.
                  </div>
                )}
              </div>
            </div>

            {/* MQTT Topic */}
            <div className="my-2">
              <label
                htmlFor="mqqtTopic"
                className="txt-base block font-bold tracking-normal"
              >
                Topic*
              </label>

              <div className="mt-1">
                <input
                  id="mqqtTopic"
                  required
                  autoFocus={true}
                  name="mqqtTopic"
                  type="text"
                  ref={mqqtTopicRef}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-base disabled:cursor-not-allowed disabled:bg-[#eee]"
                  disabled={!mqttEnabled}
                />
                {actionData?.errors?.mqqtTopic && (
                  <div className="pt-1 text-[#FF0000]" id="mqqtTopic-error">
                    {actionData.errors.mqqtTopic}
                  </div>
                )}
              </div>
            </div>

            {/* MQTT Message format */}
            <div className="my-4">
              <label
                htmlFor="mqqtTopic"
                className="txt-base block font-bold tracking-normal"
              >
                Message format*
              </label>
              <div className="mt-1">
                <RadioGroup
                  defaultValue="json"
                  disabled={!mqttEnabled}
                  className="disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="json" id="r1" />
                    <Label htmlFor="r1">json</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="r2" />
                    <Label htmlFor="r2">csv</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* MQTT Decoding options */}
            <div className="my-2">
              <label
                htmlFor="mqqtDecode"
                className="txt-base block font-bold tracking-normal"
              >
                Decoding options
              </label>

              <div className="mt-1">
                <input
                  id="mqqtDecode"
                  autoFocus={true}
                  name="mqqtDecode"
                  type="text"
                  className="w-full rounded border border-gray-200 px-2 py-1 text-base disabled:cursor-not-allowed disabled:bg-[#eee]"
                  disabled={!mqttEnabled}
                />
              </div>
            </div>

            {/* MQTT Decoding options */}
            <div>
              <label
                htmlFor="mqqtConn"
                className="txt-base block font-bold tracking-normal"
              >
                Connection options
              </label>

              <div className="mt-1">
                <input
                  id="mqqtConn"
                  name="mqqtConn"
                  type="text"
                  className="w-full rounded border border-gray-200 px-2 py-1 text-base disabled:cursor-not-allowed disabled:bg-[#eee]"
                  disabled={!mqttEnabled}
                />
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
