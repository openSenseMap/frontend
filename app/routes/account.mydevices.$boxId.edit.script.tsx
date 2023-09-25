import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { getUserId } from "~/session.server";

//*****************************************************
export async function loader({ request, params }: LoaderFunctionArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  return "";
}

//*****************************************************
export async function action({ request, params }: ActionFunctionArgs) {
  return "";
}

//**********************************
export default function EditBoxSensors() {
  const dummyScript =
    "#include <SPI.h> \n#include <Ethernet.h>\n/*\n   Zusätzliche Sensorbibliotheken, -Variablen etc im Folgenden einfügen.\n*/";

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
                  <h1 className=" text-4xl">Script</h1>
                </div>
              </div>
            </div>

            {/* divider */}
            <hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

            <textarea
              className="my-5 h-[350px] w-full rounded-[1px] border-[#ccc] font-monospace text-[90%]"
              defaultValue={dummyScript}
            ></textarea>

            <div className="rounded-[3px] border border-[#ddd]">
              <div className="border-b border-b-[ddd] bg-[#f5f5f5] px-[10px] py-[15px] text-[#333]">
                Help section
              </div>
              <ul>
                <li className="border-b border-b-[#ddd] px-[10px] py-[15px]">
                  <div className=" rounded border border-[#faebcc] bg-[#fcf8e3] p-4 text-[#8a6d3b]">
                    <p>
                      A guided instruction including the upload of the sketch is
                      available here:
                      <a
                        href="https://en.docs.sensebox.de/category/sensebox-home/"
                        className="cursor-pointer text-[#4eaf47]"
                      >
                        &nbsp;senseBox:home Documentation (english)
                      </a>
                    </p>
                  </div>
                </li>

                <li className="px-[10px] py-[15px]">
                  <div className=" rounded border border-[#faebcc] bg-[#fcf8e3] p-4 text-[#8a6d3b]">
                    <p>
                      If you would like to upload the Sketch with the Arduino
                      IDE you can find more information
                      <a
                        href="https://en.docs.sensebox.de/category/arduino/"
                        className="cursor-pointer text-[#4eaf47]"
                      >
                        &nbsp; here.
                      </a>
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
