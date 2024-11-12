import { BookA, Wrench } from "lucide-react";

export default function Connect() {
  return (
    <section
      id="connect-section"
      className="flex justify-between mx-32 gap-20 border-t border-gray-200 py-20"
    >
      <div id="left" className="w-1/2 flex flex-col gap-10">
        <div id="title" className="text-2xl font-semibold">
          Connect any device
          <div id="description" className="text-lg font-medium">
            We support preconfigured devices by some vendors but you can always
            registered your custom hardware and sensor setup.
          </div>
        </div>
        <img src="/connection.svg" alt="" className="w-1/2 h-1/2" />
      </div>
      <div id="right" className="w-1/2">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col border-2 rounded-sm px-4 py-2 text-lg">
            <a
              href="https://sensebox.de"
              rel="noopener noreferrer"
              target="_blank"
              className="flex items-center gap-3"
            >
              <BookA className="h-4 w-4 mr-2" />
              senseBox
            </a>
          </div>
          <div className="flex flex-col border-2 rounded-sm px-4 py-2 text-lg">
            <a
              href="https://www.hackair.eu/"
              rel="noopener noreferrer"
              target="_blank"
              className="flex items-center gap-3"
            >
              <BookA className="h-4 w-4 mr-2" />
              hackAIR
            </a>
          </div>
          <div className="flex flex-col border-2 rounded-sm px-4 py-2 text-lg">
            <a
              href="https://sensor.community"
              rel="noopener noreferrer"
              target="_blank"
              className="flex items-center gap-3"
            >
              <BookA className="h-4 w-4 mr-2" />
              Sensor.Community
            </a>
          </div>
          <div className="flex border-2 rounded-sm px-4 py-2 text-lg">
            <a
              href="https://tutorials.opensensemap.org/category/devices/"
              rel="noopener noreferrer"
              target="_blank"
              className="flex items-center gap-3"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Custom
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
