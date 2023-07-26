import { PlusCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { sensorWikiLabel } from "~/utils/sensor-wiki-helper";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "~/components/ui/button";
interface SelectSensorsProps {
  data: any;
}

export default function SelectSensors({ data }: SelectSensorsProps) {
  const [addedSensors, setAddedSensors] = useState(data.data.sensors ?? {});

  function addSensor(sensorItem: any, key: string) {
    //this is an array because objects would not work with the forms [sensorSlug, phenomenonId, unitSlug]
    let sensorArray = [sensorItem.sensor.slug, sensorItem.phenomenonId, ""];
    const newSensorObject = { ...addedSensors };
    if (newSensorObject[key]) {
      newSensorObject[key].push(sensorArray);
    } else {
      newSensorObject[key] = [sensorArray];
    }
    setAddedSensors(newSensorObject);
  }

  function deleteSensorItem(index: any, key: string) {
    const newSensorObject = { ...addedSensors };
    delete newSensorObject["p-" + key][index];
    setAddedSensors(newSensorObject);
  }

  return (
    <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Select Sensors
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Select the sensors you want to use by clicking on the cards. You can
          add the same sensor multiple times.
        </p>
      </div>
      <div>
        {Object.entries(data.groupedSensors).map(([key, value]) => {
          return (
            <div key={key} className="border-b-2 border-gray-600 pb-6 pt-10">
              <h1 className="pb-4 pt-2 text-2xl font-bold">
                {sensorWikiLabel(
                  data.phenomena.find((pheno: any) => pheno.id == key).label
                    .item
                )}
              </h1>
              <div className="space-y-6 sm:space-y-5">
                <div className="grid grid-cols-8 gap-4">
                  {value.map((sensor: any) => {
                    return (
                      <div key={sensor.id}>
                        <Card
                          // data-checked={selectedSensors.includes(sensor)}
                          onClick={() => addSensor(sensor, "p-" + key)}
                          key={sensor.id}
                          className="relative hover:cursor-pointer hover:ring-2 hover:ring-green-100 data-[checked=true]:ring-4 data-[checked=true]:ring-green-300"
                        >
                          <CardContent className="flex justify-center pt-2">
                            <AspectRatio ratio={4 / 3}>
                              <img
                                src={`${ENV.SENSORWIKI_API_URL}images/upload/${sensor.sensor.image}`}
                                alt={sensor.sensor.slug}
                                className="rounded-md object-cover"
                              />
                            </AspectRatio>
                          </CardContent>
                          <CardFooter className="flex justify-center">
                            <CardTitle className="text-xl">
                              {sensor.sensor.slug}
                            </CardTitle>
                            <PlusCircleIcon className="absolute bottom-0 right-0 h-5 w-5 text-green-300" />
                          </CardFooter>
                        </Card>
                      </div>
                    );
                  })}
                </div>
                <pre>{JSON.stringify(data.json, null, 2)}</pre>
              </div>
              {addedSensors["p-" + key] && (
                <div className="py-4">
                  <h3 className="pb-4 text-lg font-medium leading-6 text-gray-900">
                    Your added{" "}
                    {sensorWikiLabel(
                      data.phenomena.find((pheno: any) => pheno.id == key).label
                        .item
                    )}{" "}
                    sensors
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Sensor</TableHead>
                        <TableHead>Phenomenon</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Delete</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addedSensors["p-" + key].map(
                        (sensorItem: any, index: number) => {
                          return (
                            <TableRow key={sensorItem.id}>
                              <input
                                type="checkbox"
                                name={`sensors[p-${key.toString()}][${index}]`}
                                value={sensorItem[0]}
                                checked={true}
                                readOnly
                                className="hidden"
                              />
                              <input
                                type="checkbox"
                                name={`sensors[p-${key.toString()}][${index}]`}
                                value={key}
                                checked={true}
                                readOnly
                                className="hidden"
                              />
                              <TableCell className="font-medium">
                                <span> {sensorItem[0]}</span>
                              </TableCell>
                              <TableCell>
                                {sensorWikiLabel(
                                  data.phenomena.find(
                                    (pheno: any) => pheno.id == key
                                  ).label.item
                                )}
                              </TableCell>
                              <TableCell>
                                <select
                                  name={`sensors[p-${key.toString()}][${index}]`}
                                  id="unit"
                                >
                                  {data.phenomena
                                    .find((pheno: any) => pheno.id == key)
                                    .rov.map((rov: any) => {
                                      return (
                                        <option
                                          key={rov.id}
                                          value={rov.unit.slug}
                                        >
                                          {rov.unit.name}
                                        </option>
                                      );
                                    })}
                                </select>{" "}
                              </TableCell>
                              <TableCell>
                                <XCircleIcon
                                  onClick={() => deleteSensorItem(index, key)}
                                  title="Delete Sensor"
                                  className="h-10 w-10 cursor-pointer text-red-500"
                                ></XCircleIcon>
                              </TableCell>
                            </TableRow>
                          );
                        }
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
