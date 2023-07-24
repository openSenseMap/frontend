import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { sensorWikiLabel } from "~/utils/sensor-wiki-helper";

interface SelectSensorsProps {
  data: any;
}

export default function SelectSensors({ data }: SelectSensorsProps) {
  function findSelectedSensors(groupedSensors: any[]) {
    if (!data.data.sensors) {
      return [];
    }
    else {
      const sensors = Object.values(groupedSensors).flat();
      const selectedSensors = sensors.filter((sensor: any) =>
        data.data.sensors.includes(sensor.id.toString())
      );
      return selectedSensors;
    }// return sensors;
  }

  const [selectedSensors, setSelectedSensors] = useState(findSelectedSensors(data.groupedSensors));
  

  function toggleSelectedSensor(sensorItem: any) {
    const foundSensor = selectedSensors.find(
      (sensor: any) => sensorItem == sensor
    );
    if (foundSensor) {
      setSelectedSensors(
        selectedSensors.filter((item: any) => item !== foundSensor)
      );
    } else {
      setSelectedSensors([].concat(selectedSensors, sensorItem));
    }
  }

  return (
    <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Select Sensors
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Select the sensors you want to use.
        </p>
      </div>
      <div>
        {Object.entries(data.groupedSensors).map(([key, value]) => {
          return (
            <div key={key}>
              <h1 className="pb-4 pt-2 text-xl">
                {sensorWikiLabel(
                  data.phenomena.find((pheno: any) => pheno.id == key).label
                    .item
                )}
              </h1>
              <div className="space-y-6 divide-y divide-gray-200 sm:space-y-5">
                <div className="grid grid-cols-8 gap-4">
                  {value.map((sensor: any) => {
                    return (
                      <div key={sensor.id}>
                        <Card
                          data-checked={selectedSensors.includes(sensor)}
                          onClick={() => toggleSelectedSensor(sensor)}
                          key={sensor.id}
                          className="relative hover:cursor-pointer hover:ring-2 hover:ring-green-100 data-[checked=true]:ring-4 data-[checked=true]:ring-green-300"
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
                            <CardTitle>{sensor.sensor.slug}</CardTitle>
                            {selectedSensors.includes(sensor) && (
                              <CheckCircleIcon className="absolute bottom-0 right-0 h-5 w-5 text-green-300" />
                            )}
                          </CardFooter>
                        </Card>
                        <input
                          type="checkbox"
                          id={sensor.slug}
                          name="sensors"
                          value={sensor.id}
                          checked={selectedSensors.includes(sensor)}
                          readOnly
                          className="hidden"
                        />
                      </div>
                    );
                  })}
                </div>
                <pre>{JSON.stringify(data.json, null, 2)}</pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
