"use client";

import * as React from "react";
// import { useSearchParams, useSubmit } from "@remix-run/react";
import { format } from "date-fns";
import { de, enGB } from "date-fns/locale";
// import {
//   Clock,
//   CalendarSearch,
//   CalendarClock,
//   CalendarIcon,
// } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@remix-run/react";
import { useToast } from "@/components/ui/use-toast";

import { getUserLocale } from "get-user-locale";
import { useTranslation } from "react-i18next";

interface TimeFilterProps {
  className?: React.HTMLAttributes<HTMLDivElement>["className"];

  dateRange: DateRange | undefined;
  setDateRange: (date: DateRange | undefined) => void;

  singleDate: Date | undefined;
  setSingleDate: (date: Date | undefined) => void;

  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;

  setIsHovered: (hovered: boolean) => void;

  timeState: string;
  setTimeState: (value: string) => void;

  onChange: (timerange: any) => void;
  value: any;
}

export function TimeFilter(props: TimeFilterProps) {
  // const submit = useSubmit();
  // const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const { t } = useTranslation("navbar");
  const userLocaleString = getUserLocale();
  const userLocale = userLocaleString === "de" ? de : enGB;

  const today = new Date();

  return (
    <div className={cn("grid gap-2", "w-fit", props.className)}>
      <Dialog open={props.isDialogOpen} onOpenChange={props.setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-center text-left font-normal",
              !props.dateRange && "text-muted-foreground"
            )}
            onClick={() => props.setIsDialogOpen(true)}
          >
            {/* <CalendarIcon className="mr-2 h-5 w-5" /> */}
            {props.timeState === "live" ? (
              <span>Live</span>
            ) : props.timeState === "pointintime" ? (
              props.singleDate ? (
                <>
                  {format(
                    props.singleDate,
                    userLocaleString === "de" ? "dd/MM/yyyy" : "MM/dd/yyyy"
                  )}
                </>
              ) : (
                t("date_picker_label")
              )
            ) : props.timeState === "timeperiod" ? (
              props.dateRange?.from ? (
                props.dateRange.to ? (
                  <>
                    {format(
                      props.dateRange.from,
                      userLocaleString === "de" ? "dd/MM/yyyy" : "MM/dd/yyyy"
                    )}{" "}
                    -{" "}
                    {format(
                      props.dateRange.to,
                      userLocaleString === "de" ? "dd/MM/yyyy" : "MM/dd/yyyy"
                    )}
                  </>
                ) : (
                  format(
                    props.dateRange.from,
                    userLocaleString === "de" ? "dd/MM/yyyy" : "MM/dd/yyyy"
                  )
                )
              ) : (
                t("date_range_picker_label")
              )
            ) : null}
          </Button>
        </DialogTrigger>
        <DialogContent
          className="top-[20%] w-full p-0"
          onCloseAutoFocus={() => props.setIsHovered(false)}
        >
          <Tabs defaultValue={props.timeState} className="w-full">
            <TabsList>
              <TabsTrigger value="live">
                {/* <Clock className="h-5 w-5 pr-1" /> */}
                {t("live_label")}
              </TabsTrigger>
              <TabsTrigger value="pointintime">
                {/* <CalendarSearch className="h-5 w-5 pr-1" /> */}
                {t("pointintime_label")}
              </TabsTrigger>
              <TabsTrigger value="timeperiod">
                {/* <CalendarClock className="h-5 w-5 pr-1" /> */}
                {t("timeperiod_label")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="live" className="p-2">
              <div className="flex justify-center p-1">
                <span className="w-10/12">{t("live_description")}</span>
              </div>
              <div className="flex justify-end p-3">
                <Form
                  method="get"
                  onSubmit={() => {
                    props.setTimeState("live");
                    props.setIsDialogOpen(false);
                  }}
                >
                  <label htmlFor="filterType"> </label>
                  <input
                    type="checkbox"
                    id="filterType"
                    name="filterType"
                    value="live"
                    className="hidden"
                    defaultChecked={true}
                  />

                  <Button type="submit" className="bg-green-100">
                    {t("button")}
                  </Button>
                </Form>
              </div>
            </TabsContent>
            <TabsContent value="pointintime" className="p-2">
              <div className="flex h-16 justify-center p-1">
                <span className="w-10/12">{t("pointintime_description")}</span>
              </div>
              <div className="mx-auto min-h-[2.5rem] w-2/3 items-center justify-center rounded-t-lg border border-b-0 border-gray-100 p-2">
                {props.singleDate === undefined ? (
                  <div className="flex min-h-[2.5rem] items-center justify-center p-1">
                    {t("date_picker_label")}
                  </div>
                ) : (
                  <div className="flex shrink grow basis-10 flex-row items-center justify-center">
                    <div className="mr-2 shrink grow-0 basis-0 text-4xl font-thin capitalize text-green-100">
                      {props.singleDate?.getDate() < 10
                        ? "0" + props.singleDate?.getDate()
                        : props.singleDate?.getDate()}
                    </div>
                    <div className="flex flex-col justify-center text-sm font-light leading-4">
                      <div className="capitalize">
                        {new Intl.DateTimeFormat(
                          userLocaleString === "de" ? "de" : "en-GB",
                          { month: "long" }
                        ).format(props.singleDate)}{" "}
                        {props.singleDate?.getFullYear()}
                      </div>
                      <div className="text-left text-xs capitalize text-gray-400">
                        {new Intl.DateTimeFormat(
                          userLocaleString === "de" ? "de" : "en-GB",
                          { weekday: "long" }
                        ).format(props.singleDate)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mx-auto flex w-2/3 justify-center border border-b-0 border-x-gray-100 border-t-gray-100 p-1">
                <Calendar
                  initialFocus
                  mode="single"
                  defaultMonth={props.singleDate}
                  selected={props.singleDate}
                  onSelect={(value) => {
                    props.setSingleDate(value);
                  }}
                  locale={userLocale}
                  className="mx-auto"
                  disabled={{ after: today }}
                  toMonth={today}
                />
              </div>
              <div className="mx-auto flex w-2/3 justify-around rounded-b-lg border border-t-0 border-x-gray-100 border-b-gray-100">
                <Button
                  variant="ghost"
                  className="w-1/4 rounded-none rounded-t-lg hover:text-orange-500"
                  onClick={() => {
                    props.setSingleDate(new Date());
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  className="w-1/4 rounded-none rounded-t-lg hover:text-red-500"
                  onClick={() => {
                    props.setSingleDate(undefined);
                  }}
                >
                  Clear
                </Button>
              </div>
              <div className="flex justify-end p-3">
                <Form
                  method="get"
                  onSubmit={(e) => {
                    if (props.singleDate === undefined) {
                      e.preventDefault();
                      toast({
                        description: "Please select a date",
                      });
                    } else {
                      props.setTimeState("pointintime");
                      props.setIsDialogOpen(false);
                    }
                  }}
                >
                  <label htmlFor="filterType"></label>
                  <input
                    type="checkbox"
                    id="filterType"
                    name="filterType"
                    value="pointintime"
                    className="hidden"
                    defaultChecked={true}
                  />

                  <label htmlFor="date"></label>
                  <input
                    type="checkbox"
                    id="date"
                    name="date"
                    value={props.singleDate?.toISOString()}
                    className="hidden"
                    defaultChecked={true}
                  />

                  <Button type="submit" className="bg-green-100">
                    {t("button")}
                  </Button>
                </Form>
              </div>
            </TabsContent>
            <TabsContent value="timeperiod" className="p-2">
              <div className="flex h-16 justify-center p-1">
                <span className="w-10/12">{t("timeperiod_description")}</span>
              </div>
              <div className="mx-auto min-h-[2.5rem] w-2/3 items-center justify-center rounded-t-lg border border-b-0 border-gray-100 p-2">
                {props.dateRange === undefined ||
                props.dateRange.from === undefined ? (
                  <div className="flex min-h-[2.5rem] items-center justify-center p-1">
                    {t("date_range_picker_label")}
                  </div>
                ) : (
                  <div className="flex justify-around">
                    <div className="flex shrink grow basis-10 flex-row items-center justify-center">
                      <div className="mr-2 shrink grow-0 basis-0 text-4xl font-thin capitalize text-green-100">
                        {props.dateRange?.from?.getDate() < 10
                          ? "0" + props.dateRange.from?.getDate()
                          : props.dateRange.from?.getDate()}
                      </div>
                      <div className="flex flex-col justify-center text-sm font-light leading-4">
                        <div className="capitalize">
                          {new Intl.DateTimeFormat(
                            userLocaleString === "de" ? "de" : "en-GB",
                            { month: "long" }
                          ).format(props.dateRange.from)}{" "}
                          {props.dateRange.from?.getFullYear()}
                        </div>
                        <div className="text-left text-xs capitalize text-gray-400">
                          {new Intl.DateTimeFormat(
                            userLocaleString === "de" ? "de" : "en-GB",
                            { weekday: "long" }
                          ).format(props.dateRange.from)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="mr-2 text-4xl font-thin capitalize text-gray-200">
                        -
                      </div>
                    </div>

                    {props.dateRange.to !== undefined ? (
                      <div className="flex shrink grow basis-10 flex-row items-center justify-center">
                        <div className="mr-2 shrink grow-0 basis-0 text-4xl font-thin capitalize text-green-100">
                          {props.dateRange.to?.getDate() < 10
                            ? "0" + props.dateRange.to?.getDate()
                            : props.dateRange.to?.getDate()}
                        </div>
                        <div className="flex flex-col justify-center text-sm font-light leading-4">
                          <div className="capitalize">
                            {new Intl.DateTimeFormat(
                              userLocaleString === "de" ? "de" : "en-GB",
                              { month: "long" }
                            ).format(props.dateRange.to)}{" "}
                            {props.dateRange.to?.getFullYear()}
                          </div>
                          <div className="text-left text-xs capitalize text-gray-400">
                            {new Intl.DateTimeFormat(
                              userLocaleString === "de" ? "de" : "en-GB",
                              { weekday: "long" }
                            ).format(props.dateRange.to)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex grow basis-10 " />
                    )}
                  </div>
                )}
              </div>
              <div className="mx-auto flex w-2/3 justify-center border border-b-0 border-x-gray-100 border-t-gray-100 p-1">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={props.dateRange?.from}
                  selected={props.dateRange}
                  onSelect={props.setDateRange}
                  locale={userLocale}
                  className="mx-auto"
                  disabled={{ after: today }}
                  toMonth={today}
                />
              </div>
              <div className="mx-auto flex w-2/3 justify-around rounded-b-lg border border-t-0 border-x-gray-100 border-b-gray-100">
                <Button
                  variant="ghost"
                  className="w-1/4 rounded-none rounded-t-lg hover:text-orange-500"
                  onClick={() => {
                    props.setDateRange({ from: new Date(), to: new Date() });
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  className="w-1/4 rounded-none rounded-t-lg hover:text-red-500"
                  onClick={() => {
                    props.setDateRange(undefined);
                  }}
                >
                  Clear
                </Button>
              </div>
              <div className="flex justify-end p-3">
                <Form
                  method="get"
                  onSubmit={(e) => {
                    if (
                      props.dateRange?.from === undefined ||
                      props.dateRange?.to === undefined
                    ) {
                      e.preventDefault();
                      toast({
                        description: "Please select a date range",
                      });
                    } else {
                      props.setTimeState("timeperiod");
                      props.setIsDialogOpen(false);
                    }
                  }}
                >
                  <label htmlFor="filterType"></label>
                  <input
                    type="checkbox"
                    id="filterType"
                    name="filterType"
                    value="timeperiod"
                    className="hidden"
                    defaultChecked={true}
                  />

                  <label htmlFor="from"></label>
                  <input
                    type="checkbox"
                    id="from"
                    name="from"
                    value={props.dateRange?.from?.toISOString()}
                    className="hidden"
                    defaultChecked={true}
                  />

                  <label htmlFor="to"></label>
                  <input
                    type="checkbox"
                    id="to"
                    name="to"
                    value={props.dateRange?.to?.toISOString()}
                    className="hidden"
                    defaultChecked={true}
                  />

                  <Button type="submit" className="bg-green-100">
                    {t("button")}
                  </Button>
                </Form>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
