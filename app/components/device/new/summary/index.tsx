import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { sensorWikiLabel } from "~/utils/sensor-wiki-helper";

interface SummaryProps {
  data: any;
  phenomena: any;
}

export default function Summary({ data, phenomena }: SummaryProps) {
  return (
    <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
      <h3 className="text-lg font-medium leading-6 text-gray-900">
        Your device overview
      </h3>
      <p className="mt-1 max-w-2xl text-sm text-gray-500">
        Please check if everything is setup correctly.
      </p>
      <h4>Your general Information</h4>
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
            <TableCell className="font-medium">Height</TableCell>
            <TableCell className="font-bold">{data.height}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <h4>Your sensors</h4>
      <Table>
        {/* <TableCaption>General Information</TableCaption> */}
        <TableHeader>
          <TableRow>
            <TableHead>Sensortype</TableHead>
            <TableHead>Phenomenon</TableHead>
            <TableHead>Unit</TableHead>
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
                      phenomena.find((pheno: any) => pheno.id == sensor[1])
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

      <h4>Your Extensions</h4>
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
                <TableCell className="font-medium">{data.mqttTopic}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">mqttFormat</TableCell>
                <TableCell className="font-medium">{data.mqttFormat}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">mqttDecodeOptions</TableCell>
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
  );
}
