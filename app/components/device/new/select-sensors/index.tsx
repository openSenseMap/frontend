import { AspectRatio } from "~/components/ui/aspect-ratio";
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
} from "~/components/ui/card";

interface SelectSensorsProps {
  data: any;
}

export default function SelectSensors({ data }: SelectSensorsProps) {
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
                {data.phenomena.find((pheno: any) => pheno.id == key).slug}
              </h1>
              <div className="space-y-6 divide-y divide-gray-200 sm:space-y-5">
                <div className="grid grid-cols-8 gap-4">
                  {value.map((sensor: any) => {
                    return (
                      <Card
                        // data-checked={}
                        // onClick={}
                        key={sensor.id}
                        className="data-[checked=true]:ring-2 data-[checked=true]:ring-green-300"
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
                        </CardFooter>
                      </Card>
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
