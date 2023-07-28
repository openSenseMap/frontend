import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { t } from "i18next";
import { sensorWikiLabel } from "~/utils/sensor-wiki-helper";

interface SummaryProps {
  data: any;
  phenomena: any;
}

export default function Summary({ data, phenomena }: SummaryProps) {
  return (
    <>
      <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {t("summary")}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {t("summary_text")}
          </p>
        </div>

        <h4 className="pt-6"> {t("general")}</h4>

        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Type</TableCell>
              <TableCell className="font-bold">{data.type}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Name</TableCell>
              <TableCell className="font-bold">{data.name}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Exposure</TableCell>
              <TableCell className="font-bold">{data.exposure}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Tags</TableCell>
              <TableCell className="font-bold">{data.groupId}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Latitude</TableCell>
              <TableCell className="font-bold">{data.latitude}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Longitude</TableCell>
              <TableCell className="font-bold">{data.longitude}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">{t("height")}</TableCell>
              <TableCell className="font-bold">{data.height}</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <h4 className="pt-6">{t("your_sensors")}</h4>
        <Table>
          {/* <TableCaption>General Information</TableCaption> */}
          <TableHeader>
            <TableRow>
              <TableHead>{t("sensor")}</TableHead>
              <TableHead>{t("phenomenon")}</TableHead>
              <TableHead>{t("unit")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.values(data.sensors).map((phenomenon: any) => {
              return phenomenon.map((sensor: any, index: any) => {
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{sensor[0]}</TableCell>
                    <TableCell className="font-medium">
                      {sensorWikiLabel(
                        phenomena.find((pheno: any) => pheno.slug == sensor[1])
                          .label.item
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{sensor[2]}</TableCell>
                  </TableRow>
                );
              });
            })}
          </TableBody>
        </Table>

        <h4 className="pt-6">Your Extensions</h4>
        {data.ttnEnabled && (
          <div>
            <h5>TTN</h5>
            <Table>
              {/* <TableCaption>General Information</TableCaption> */}
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">ttnAppId</TableCell>
                  <TableCell className="font-medium">{data.ttnAppId}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ttnDeviceId</TableCell>
                  <TableCell className="font-medium">
                    {data.ttnDeviceId}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {data.mqttEnabled && (
          <div>
            <h5>MQTT</h5>
            <Table>
              {/* <TableCaption>General Information</TableCaption> */}
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">mqttUrl</TableCell>
                  <TableCell className="font-medium">{data.mqttUrl}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">mqttTopic</TableCell>
                  <TableCell className="font-medium">
                    {data.mqttTopic}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">mqttFormat</TableCell>
                  <TableCell className="font-medium">
                    {data.mqttFormat}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    mqttDecodeOptions
                  </TableCell>
                  <TableCell className="font-medium">
                    {data.mqttDecodeOptions}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    mqttConnectOptions
                  </TableCell>
                  <TableCell className="font-medium">
                    {data.mqttConnectOptions}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </>
  );
}
