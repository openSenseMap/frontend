import { useEffect, useState, useRef } from "react";
import Search from "~/components/search";
import {
  SunIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { TimeFilter } from "~/components/header/nav-bar/time-filter";
import type { DateRange } from "react-day-picker";
import getUserLocale from "get-user-locale";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import type { Device } from "@prisma/client";
import { useSearchParams } from "@remix-run/react";

interface NavBarProps {
  devices: Device[];
}

type ValuePiece = Date | string | null;

type Value = ValuePiece;

export default function NavBar(props: NavBarProps) {
  let { t } = useTranslation("navbar");
  const [searchParams, setSearchParams] = useSearchParams();
  // console.log("🚀 ~ file: index.tsx:24 ~ NavBar ~ searchParams:", searchParams.has("filterType"))

  const [timeState, setTimeState] = useState<string | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const [value, onChange] = useState<Value>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
  const userLocaleString = getUserLocale();

  /**
   * Set the time state based on the search params
   */
  useEffect(() => {
    if (searchParams.has("filterType")) {
      var filterType = searchParams.get("filterType");
      if (filterType === "live") {
        setTimeState("live");
      } else if (filterType === "pointintime" && searchParams.has("date")) {
        setTimeState("pointintime");
        setSingleDate(new Date(searchParams.get("date") as string));
      } else if (
        filterType === "timeperiod" &&
        searchParams.has("from") &&
        searchParams.has("to")
      ) {
        setTimeState("timeperiod");
        setDateRange({
          from: new Date(searchParams.get("from") as string),
          to: new Date(searchParams.get("to") as string),
        });
      } else {
        return;
      }
    } else {
      searchParams.append("filterType", "live")
      setTimeState("live");
    }
  }, [searchParams, setSearchParams]);

  /**
   * Focus the search input
   */
  const focusSearchInput = () => {
    searchRef.current?.focus();
  };

  /**
   * Display the search
   */
  const displaySearch = () => {
    setShowSearch(true);
    setTimeout(() => {
      focusSearchInput();
    }, 100);
  };

  /**
   * Close the search when the escape key is pressed
   *
   * @param event event object
   */
  const closeSearch = (event: any) => {
    if (event.key === "Escape") {
      setShowSearch(false);
    }
  };

  /**
   * useEffect hook to attach and remove the event listener
   */
  useEffect(() => {
    // attach the event listener
    document.addEventListener("keydown", closeSearch);

    // remove the event listener
    return () => {
      document.removeEventListener("keydown", closeSearch);
    };
  });

  // useEffect(() => {
  //   console.log("dateRange", dateRange);
  //   console.log("time", value);
  //   console.log("singleDate", singleDate);
  // }, [dateRange, value, singleDate]);

  return (
    <div className="pointer-events-auto h-10 w-1/2">
      {!isHovered && !showSearch ? (
        <div
          className="flex h-10 w-full items-center justify-around rounded-[1.25rem] border border-gray-100 bg-white shadow-xl"
          onMouseEnter={() => {
            setIsHovered(true);
          }}
        >
          <div className="flex h-6 w-3/12 items-center justify-center space-x-2 rounded-full bg-orange-500">
            <SunIcon className="h-4 w-4 text-white" />
            <div className="text-center text-white">
              {t("temperature_label")}
            </div>
          </div>
          <div className="ring-slate-900/10 flex h-6 w-3/12 items-center justify-between space-x-2 rounded-full bg-white pl-2 pr-3 shadow-lg ring-1">
            <MagnifyingGlassIcon className="h-4 w-4 text-blue-500" />
            <span className="text-center text-blue-500">Suche</span>
            <span className="flex-none text-xs font-semibold text-gray-400">
              <kbd>Ctrl</kbd> + <kbd>K</kbd>
            </span>
          </div>
          <div className="flex h-6 w-3/12 items-center justify-center space-x-2 rounded-full bg-blue-700">
            <CalendarDaysIcon className="h-4 w-4 text-white" />
            <div className="text-center text-white">
              {timeState === "live" ? (
                <span>{t("live_label")}</span>
              ) : timeState === "pointintime" ? (
                singleDate ? (
                  <>
                    {format(
                      singleDate,
                      userLocaleString === "de" ? "dd/MM/yyyy" : "MM/dd/yyyy"
                    )}
                  </>
                ) : (
                  t("date_picker_label")
                )
              ) : timeState === "timeperiod" ? (
                dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(
                        dateRange.from,
                        userLocaleString === "de" ? "dd/MM/yyyy" : "MM/dd/yyyy"
                      )}{" "}
                      -{" "}
                      {format(
                        dateRange.to,
                        userLocaleString === "de" ? "dd/MM/yyyy" : "MM/dd/yyyy"
                      )}
                    </>
                  ) : (
                    format(
                      dateRange.from,
                      userLocaleString === "de" ? "dd/MM/yyyy" : "MM/dd/yyyy"
                    )
                  )
                ) : (
                  t("date_range_picker_label")
                )
              ) : null}
            </div>
          </div>
        </div>
      ) : isHovered && !showSearch ? (
        <div
          className="w-full items-center overflow-visible rounded-[1.25rem] border border-gray-100 bg-white p-2 shadow"
          onMouseLeave={() => {
            if (!isDialogOpen) {
              setIsHovered(false);
            }
          }}
        >
          <button
            onClick={() => displaySearch()}
            className="ring-slate-900/10 hover:ring-slate-300 mx-auto mb-2 flex h-7 w-1/2 items-center justify-between space-x-2 rounded-full bg-white pl-2 pr-3 shadow-lg ring-1 hover:bg-gray-200"
          >
            <MagnifyingGlassIcon className="h-6 w-6 text-blue-500" />
            <span className="text-center text-blue-500">Suche</span>
            <span className="flex-none text-xs font-semibold text-gray-400">
              <kbd>{t("ctrl")}</kbd> + <kbd>K</kbd>
            </span>
          </button>
          <hr className="solid border-t-2 px-2"></hr>
          <div className="flex w-full justify-end p-2">
            <TimeFilter
              dateRange={dateRange}
              setDateRange={setDateRange}
              singleDate={singleDate}
              setSingleDate={setSingleDate}
              isDialogOpen={isDialogOpen}
              setIsDialogOpen={setIsDialogOpen}
              setIsHovered={setIsHovered}
              onChange={onChange}
              value={value}
              timeState={timeState}
              setTimeState={setTimeState}
            />
          </div>
        </div>
      ) : (
        <div
          className="w-full items-center rounded-[1.25rem] border border-gray-100 bg-white px-2 py-1 shadow-xl"
          onMouseLeave={() => {
            setIsHovered(false);
          }}
          onMouseEnter={() => {
            setIsHovered(true);
          }}
        >
          <Search
            devices={props.devices}
            searchRef={searchRef}
            setShowSearch={() => {
              setShowSearch(false);
              setIsHovered(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
