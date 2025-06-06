import { ArrowUpDown, RadioTower, Unplug } from "lucide-react";

export default function Integrations() {
  return (
    <section
      id="integrations"
      className="flex justify-between gap-10"
    >
      <div id="left" className="w-1/2 flex flex-col gap-10">
        <div id="title" className="text-2xl font-semibold">
          Integrations
          <div id="description" className="text-lg font-medium">
            We support different data communication protocols and offer specific
            integrations for them.
          </div>
        </div>
        <img src="/integration.svg" alt="" className="w-1/2 h-1/2" />
      </div>
      <div id="right" className="w-1/2">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col border-2 rounded-sm px-4 py-2 text-lg">
            <a
              href="https://docs.opensensemap.org/"
              rel="noopener noreferrer"
              target="_blank"
              className="flex items-center gap-3"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              HTTP API
            </a>
          </div>
          <div className="flex flex-col border-2 rounded-sm px-4 py-2 text-lg">
            <a
              href="https://tutorials.opensensemap.org/integrations/integrations-mqtt/"
              rel="noopener noreferrer"
              target="_blank"
              className="flex items-center gap-3"
            >
              <Unplug className="h-4 w-4 mr-2" />
              MQTT
            </a>
          </div>
          <div className="flex flex-col border-2 rounded-sm px-4 py-2 text-lg">
            <a
              href="https://tutorials.opensensemap.org/integrations/integrations-ttnv3/"
              rel="noopener noreferrer"
              target="_blank"
              className="flex items-center gap-3"
            >
              <RadioTower className="h-4 w-4 mr-2" />
              TTN v3 (LoRa WAN)
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
