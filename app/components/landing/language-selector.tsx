import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useState } from "react";
import i18next from "i18next";
import type { loader } from "~/root";

/**
 * This component allows users to select their preferred language.
 *
 * The component uses the `useLoaderData` hook to get the current language from the browser's header,
 * and the `useState` hook to store the user's selected language.
 * When the user changes the language, the component calls the `i18next.changeLanguage()` function
 * to change the language of the application. The component also submits a form to the server
 * to save the user's selected language.
 */
export default function LanguageSelector() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [locale, setLocale] = useState(data.locale || "en");

  /**
   * This function is called when the user changes the language.
   *
   * The function calls the `i18next.changeLanguage()` function to change the language of the application,
   * and submits a form to the server to save the user's selected language.
   */
  const handleValueChange = (value: string) => {
    i18next.changeLanguage(value);
    fetcher.submit(
      { language: value },
      { method: "post", action: "/action/set-language" }
    );
  };

  return (
    <div>
      <Select
        onValueChange={(value) => {
          setLocale(value);
          handleValueChange(value);
        }}
        defaultValue={locale}
      >
        <SelectTrigger className="rounded-full focus:ring-0 focus:ring-offset-0">
          <SelectValue
            placeholder={
              locale === "de" ? (
                <img
                  alt="usa flag"
                  src="/landing/germany-flag-round-circle-icon.png"
                  className="h-8 w-8"
                ></img>
              ) : (
                <img
                  alt="usa flag"
                  src="/landing/usa-flag-round-circle-icon.png"
                  className="h-8 w-8"
                ></img>
              )
            }
          />
        </SelectTrigger>
        <SelectContent className="min-w-0">
          <SelectItem value="en" className="cursor-pointer">
            <img
              alt="usa flag"
              src="/landing/usa-flag-round-circle-icon.png"
              className="h-8 w-8"
            ></img>
          </SelectItem>
          <SelectItem value="de" className="cursor-pointer">
            <img
              alt="germany flag"
              src="/landing/germany-flag-round-circle-icon.png"
              className="h-8 w-8"
            ></img>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
