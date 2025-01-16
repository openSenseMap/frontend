import { CloudSunRain, SunIcon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Form } from "react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "~/lib/utils";
import { type Phenomenon } from "~/models/phenomena.server";
import { sensorWikiLabel } from "~/utils/sensor-wiki-helper";

interface SensorFilterProps {
  className?: React.HTMLAttributes<HTMLDivElement>["className"];

  sensor: string | undefined;
  setSensor: (sensor: string | undefined) => void;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;

  setIsHovered: (hovered: boolean) => void;
  phenomena: Phenomenon[];
}

export function SensorFilter(props: SensorFilterProps, request: Request) {
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
            <span>{t("phenomenons")}</span>
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
                    "hover:text-light-green " +
                    (props.sensor === "all" ? "text-light-green" : "")
                  }
                  onClick={() => props.setSensor("all")}
                >
                  <span>{t("all_stations")}</span>
                </button>
              </li>
              {props.phenomena.map((p, i) => {
                return (
                  <li className="py-1" key={p.id}>
                    <button
                      className={
                        "flex items-center gap-2 hover:text-light-green " +
                        (props.sensor === p.slug ? "text-light-green" : "")
                      }
                      onClick={() => props.setSensor(p.slug)}
                    >
                      <SunIcon className="h-4 w-4" />
                      <span>{sensorWikiLabel(p.label.item)}</span>
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
              <Button type="submit" className="bg-light-green">
                {t("button")}
              </Button>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
