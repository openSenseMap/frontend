import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { sensorWikiLabel } from "~/utils/sensor-wiki-helper";

interface SummaryProps {
  data: any;
  phenomena: any;
}

export default function Summary({ data, phenomena }: SummaryProps) {
  const { t } = useTranslation("newdevice");
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

        <h4 className="pt-6"> {t("summary_general")}</h4>

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

        <h4 className="pt-6">{t("summary_sensors")}</h4>
        <Table>
          {/* <TableCaption>General Information</TableCaption> */}
          <TableHeader>
            <TableRow>
              <TableHead>{t("title")}</TableHead>
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
                    <TableCell className="font-medium">{sensor[1]}</TableCell>
                    <TableCell className="font-medium">
                      {sensorWikiLabel(
                        phenomena.find((pheno: any) => pheno.slug == sensor[2])
                          .label.item
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{sensor[3]}</TableCell>
                  </TableRow>
                );
              });
            })}
          </TableBody>
        </Table>

        <h4 className="pt-6">Your Extensions</h4>
        {data["ttn.enabled"] && (
          <div>
            <h5>TTN</h5>
            <Table>
              {/* <TableCaption>General Information</TableCaption> */}
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">App ID</TableCell>
                  <TableCell className="font-medium">
                    {data["ttn.appId"]}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Device ID</TableCell>
                  <TableCell className="font-medium">
                    {data["ttn.devId"]}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Decode Profile</TableCell>
                  <TableCell className="font-medium">
                    {data["ttn.decodeProfile"]}
                  </TableCell>
                </TableRow>
                {!data["ttn.decodeOptions"] || data["ttn.decodeOptions"] !== "" && (
                  <TableRow>
                    <TableCell className="font-medium">
                      Decode Options
                    </TableCell>
                    <TableCell className="font-medium">
                      {data["ttn.decodeOptions"]}
                    </TableCell>
                  </TableRow>
                )}
                {data["ttn.port"] !== "" && (
                  <TableRow>
                    <TableCell className="font-medium">Port</TableCell>
                    <TableCell className="font-medium">
                      {data["ttn.port"]}
                    </TableCell>
                  </TableRow>
                )}
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
                  <TableCell className="font-medium">URL</TableCell>
                  <TableCell className="font-medium">{data["mqtt.url"]}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Topic</TableCell>
                  <TableCell className="font-medium">
                    {data["mqtt.topic"]}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Message Format</TableCell>
                  <TableCell className="font-medium">
                    {data["mqtt.messageFormat"]}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Decode Options
                  </TableCell>
                  <TableCell className="font-medium">
                    {data["mqtt.decodeOptions"]}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Connection Options
                  </TableCell>
                  <TableCell className="font-medium">
                    {data["mqtt.connectOptions"]}
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
