import { PlusCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { sensorWikiLabel } from "~/utils/sensor-wiki-helper";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Trans, useTranslation } from "react-i18next";
import { useField } from "remix-validated-form";
import SensorWikHoverCard from "~/components/sensor-wiki-hover-card";
import { InfoIcon } from "lucide-react";

interface SelectSensorsProps {
  data: any;
}

export default function SelectSensors({ data }: SelectSensorsProps) {
  const [addedSensors, setAddedSensors] = useState(data.data.sensors ?? {});
  const { t } = useTranslation("newdevice");

  const sensorsField = useField("sensors");

  function addSensor(sensorItem: any, key: string) {
    //this is an array because objects would not work with the forms [sensorSlug, phenomenonId, unitSlug]
    let sensorArray = ["", sensorItem.sensor.slug, sensorItem.phenomenonId, ""];
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
    newSensorObject["p-" + key].splice(index, 1);
    setAddedSensors(newSensorObject);
  }

  return (
    <div className="space-y-4 pt-4">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {t("select_sensors")}
        </h3>
        {sensorsField.error && (
          <span className="text-red-500">{sensorsField.error}</span>
        )}
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {t("select_sensors_text")}
        </p>
      </div>

      <div className="py-2">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            <Trans
              t={t}
              i18nKey="select_sensors_info_text"
              components={[
                <a
                  key="add_sensor_to_sensorwiki"
                  href="https://sensors.wiki/sensor/add"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:text-blue-700 hover:underline"
                >
                  placeholder
                </a>,
              ]}
            />
          </AlertDescription>
        </Alert>
      </div>

      <div>
        {Object.entries(data.groupedSensors).map(([key, value]) => {
          return (
            <div key={key} className="border-b-2 border-gray-600 pb-6 pt-10">
              <SensorWikHoverCard
                slug={data.phenomena.find((pheno: any) => pheno.id == key).slug}
                type="phenomena"
                trigger={
                  <h1 className="pb-4 pt-2 text-2xl font-bold w-fit">
                    {sensorWikiLabel(
                      data.phenomena.find((pheno: any) => pheno.id == key).label
                        .item,
                    )}
                  </h1>
                }
              />
              <div className="space-y-6 sm:space-y-5">
                <div className="grid grid-cols-8 gap-4">
                  {/** @ts-ignore */}
                  {value.map((sensor: any) => {
                    return (
                      <SensorWikHoverCard
                        key={sensor.id}
                        slug={sensor.sensor.slug}
                        type="sensors"
                        openDelay={300}
                        closeDelay={100}
                        trigger={
                          <Card
                            // data-checked={selectedSensors.includes(sensor)}
                            onClick={() => {
                              addSensor(sensor, "p-" + key);
                              sensorsField.validate();
                            }}
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
                                {sensor.sensor.label.item[0].text}
                              </CardTitle>
                              <PlusCircleIcon className="absolute bottom-0 right-0 h-5 w-5 text-green-300" />
                            </CardFooter>
                          </Card>
                        }
                      />
                    );
                  })}
                </div>
                <pre>{JSON.stringify(data.json, null, 2)}</pre>
              </div>
              {addedSensors["p-" + key] &&
                addedSensors["p-" + key].length > 0 && (
                  <div className="py-4">
                    <h3 className="pb-4 text-lg font-medium leading-6 text-gray-900">
                      {t("your_added")}{" "}
                      {sensorWikiLabel(
                        data.phenomena.find((pheno: any) => pheno.id == key)
                          .label.item,
                      )}{" "}
                      {t("sensors")}
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("title")}</TableHead>
                          <TableHead className="w-[100px]">
                            {t("sensor")}
                          </TableHead>
                          <TableHead>{t("phenomenon")}</TableHead>
                          <TableHead>{t("unit")}</TableHead>
                          <TableHead>{t("delete")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {addedSensors["p-" + key].map(
                          (sensorItem: any, index: number) => {
                            return (
                              <TableRow key={sensorItem.id}>
                                <TableCell>
                                  <input
                                    type="text"
                                    name={`sensors[p-${key.toString()}][${index}]`}
                                    placeholder={
                                      sensorItem[0]
                                        ? sensorItem[0]
                                        : "Your sensors name"
                                    }
                                  />
                                </TableCell>
                                <input
                                  type="checkbox"
                                  name={`sensors[p-${key.toString()}][${index}]`}
                                  value={sensorItem[1]}
                                  checked={true}
                                  readOnly
                                  className="hidden"
                                />
                                <input
                                  type="checkbox"
                                  name={`sensors[p-${key.toString()}][${index}]`}
                                  value={
                                    data.phenomena.find(
                                      (pheno: any) => pheno.id == key,
                                    ).slug
                                  }
                                  checked={true}
                                  readOnly
                                  className="hidden"
                                />
                                <TableCell className="font-medium">
                                  <span> {sensorItem[1]}</span>
                                </TableCell>
                                <TableCell>
                                  {sensorWikiLabel(
                                    data.phenomena.find(
                                      (pheno: any) => pheno.id == key,
                                    ).label.item,
                                  )}
                                </TableCell>
                                <TableCell>
                                  <select
                                    name={`sensors[p-${key.toString()}][${index}]`}
                                    id="unit"
                                    className="overflow-visible"
                                  >
                                    {data.phenomena
                                      .find((pheno: any) => pheno.id == key)
                                      .rov.map((rov: any) => {
                                        return (
                                          <SensorWikHoverCard
                                          key={rov.id}
                                          slug={rov.unit.slug}
                                          type="units"
                                          avoidCollisions={false}
                                          side="right"
                                            trigger={
                                              <option
                                                key={rov.id}
                                                value={rov.unit.slug}
                                              >
                                                {rov.unit.name}
                                              </option>
                                            }
                                            openDelay={0}
                                            closeDelay={0}
                                          />
                                        );
                                      })}
                                  </select>{" "}
                                </TableCell>
                                <TableCell>
                                  <XCircleIcon
                                    onClick={() => {
                                      deleteSensorItem(index, key);
                                      sensorsField.validate();
                                    }}
                                    title="Delete Sensor"
                                    className="h-10 w-10 cursor-pointer text-red-500"
                                  ></XCircleIcon>
                                </TableCell>
                              </TableRow>
                            );
                          },
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
