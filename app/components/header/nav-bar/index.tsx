import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { Device } from "@prisma/client";
import { useState, useEffect, useRef, createContext } from "react";
import { useMap } from "react-map-gl";
import NavbarHandler from "./nav-bar-handler";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface NavBarProps {
  devices: Device[];
}

export const NavbarContext = createContext({
  open: false,
  setOpen: (_open: boolean) => {},
});

export default function NavBar(props: NavBarProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchString, setSearchString] = useState("");

  const { osem: mapRef } = useMap();

  const { t } = useTranslation("search");

  useEffect(() => {
    if (mapRef) {
      mapRef.on("click", () => setOpen(false));
    }
  }, [mapRef]);

  // register keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prevState) => !prevState);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // focus input when opening
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
      setSearchString("");
    }
  }, [open]);

  return (
    <div className="pointer-events-auto relative w-full md:w-1/2">
      <div className="absolute left-0 top-0 w-full rounded-2xl border border-gray-100 bg-white px-2 py-2 shadow-xl md:px-4">
        <div className="flex w-full items-center gap-2 px-2 md:gap-4">
          <MagnifyingGlassIcon className="aspect-square h-6" />
          <input
            ref={inputRef}
            placeholder={t("placeholder") || undefined}
            onFocus={() => setOpen(true)}
            onChange={(e) => setSearchString(e.target.value)}
            className="h-fit w-full flex-1 border-none focus:border-none focus:outline-none focus:ring-0"
            value={searchString}
          />
          {!open && (
            <span className="hidden flex-none text-xs font-semibold text-gray-400 md:block">
              <kbd>ctrl</kbd> + <kbd>K</kbd>
            </span>
          )}
          {open && (
            <XMarkIcon
              onClick={() => {
                setSearchString("");
                setOpen(false);
                inputRef.current?.blur();
              }}
              className="h-6"
            />
          )}
        </div>
        <NavbarContext.Provider value={{ open, setOpen }}>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, translateY: -10 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -10 }}
              >
                <NavbarHandler
                  devices={props.devices}
                  searchString={searchString}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </NavbarContext.Provider>
      </div>
    </div>
  );
}
