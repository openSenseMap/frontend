import * as React from "react";
import { de, enGB } from "date-fns/locale";
import { CloudSunRain, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Form, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { cn } from "~/lib/utils";
// import { LoaderArgs, json } from "@remix-run/node";
// import { getPhenomena } from "~/models/phenomena.server";

// export async function loader({ request }: LoaderArgs) {
//   // const response = await fetch("https://api.sensors.wiki/phenomena/all");
//   // const phenomena = await response.json();
//   const phenomena = await getPhenomena();
//   return json({ phenomena });
// }

interface SensorFilterProps {
  className?: React.HTMLAttributes<HTMLDivElement>["className"];

  sensor: string | undefined;
  setSensor: (sensor: string | undefined) => void;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;

  setIsHovered: (hovered: boolean) => void;

  onChange: (timerange: any) => void;
  value: any;

  phenomena: any[];
}

export function SensorFilter(props: SensorFilterProps) {
  const { t } = useTranslation("navbar");

  return (
    <div className={cn("grid gap-2", "w-fit", props.className)}>
      <Dialog open={props.isDialogOpen} onOpenChange={props.setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            id="sensor"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-center text-left font-normal"
              // !props.dateRange && "text-muted-foreground"
            )}
            onClick={() => props.setIsDialogOpen(true)}
          >
            <CloudSunRain className="mr-2 h-5 w-5" />
            <span>Sensoren</span>
          </Button>
        </DialogTrigger>
        <DialogContent
          className="top-[20%] w-full p-0"
          onCloseAutoFocus={() => props.setIsHovered(false)}
        >
          <div className="flex flex-col gap-3 p-6">
            <ul>
              <li>
                <button
                  className={
                    "hover:text-green-100" +
                    (props.sensor === "all" ? "text-green-300" : "")
                  }
                  onClick={() => props.setSensor("all")}
                >
                  <span>Alle Messtationen</span>
                </button>
              </li>
              {props.phenomena.map((p, i) => {
                return (
                  <li key={p.id}>
                    <button
                      className={
                        "flex gap-2 hover:text-green-100" +
                        (props.sensor === p.label.item[0].text
                          ? "text-green-300"
                          : "")
                      }
                      onClick={() => props.setSensor(p.label.item[0].text)}
                    >
                      <SunIcon className="h-4 w-4" />
                      <span>{p.label.item[0].text}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex justify-end p-3">
            <Form
              method="get"
              onSubmit={() => {
                props.setIsDialogOpen(false);
              }}
            >
              <label htmlFor="phenomenon"> </label>
              <input
                type="checkbox"
                id="phenomenon"
                name="phenomenon"
                value={props.sensor}
                className="hidden"
                defaultChecked={true}
              />
              <Button type="submit" className="bg-green-100">
                {t("button")}
              </Button>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
