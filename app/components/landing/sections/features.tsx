import {
  Copyleft,
  Download,
  GitFork,
  Scale,
  Telescope,
  Terminal,
  Trash,
} from "lucide-react";

export default function Features() {
  return (
    <section
      id="features"
      className="flex justify-between gap-10"
    >
      <div id="left" className="w-1/2 flex flex-col gap-10">
        <div id="title" className="text-2xl font-semibold">
          Features
          <div id="description" className="text-lg font-medium">
            The openSenseMap platform has a lot to offer that makes
            discoverability and sharing of environmental and sensor data easy.
          </div>
        </div>
        <img src="/features.svg" alt="" className="w-1/2 h-1/2" />
      </div>
      <div id="right" className="w-1/2">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col border-2 rounded-sm px-4 py-2 text-lg">
            <div className="flex items-center gap-3">
              <GitFork className="h-4 w-4 mr-2" />
              Data aggregation
            </div>
          </div>
          <div className="flex flex-col border-2 rounded-sm px-4 py-2 text-lg">
            <div className="flex items-center gap-3">
              <Trash className="h-4 w-4 mr-2" />
              No data retention
            </div>
          </div>
          <div className="flex flex-col border-2 rounded-sm px-4 py-2 text-lg">
            <div className="flex items-center gap-3">
              <Copyleft className="h-4 w-4 mr-2" />
              Data published as ODbL
            </div>
          </div>
          <div className="flex border-2 rounded-sm px-4 py-2 text-lg">
            <div className="flex items-center gap-3">
              <Telescope className="h-4 w-4 mr-2" />
              Discover devices
            </div>
          </div>
          <div className="flex border-2 rounded-sm px-4 py-2 text-lg">
            <div className="flex items-center gap-3">
              <Scale className="h-4 w-4 mr-2" />
              Compare devices
            </div>
          </div>
          <div className="flex border-2 rounded-sm px-4 py-2 text-lg">
            <div className="flex items-center gap-3">
              <Download className="h-4 w-4 mr-2" />
              Download options
            </div>
          </div>
          <div className="flex border-2 rounded-sm px-4 py-2 text-lg">
            <div className="flex items-center gap-3">
              <Terminal className="h-4 w-4 mr-2" />
              HTTP REST API
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
