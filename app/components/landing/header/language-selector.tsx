import i18next from "i18next";
import { Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
// import  { type loader } from "~/root";

export default function LanguageSelector() {
  const data = useLoaderData();
  const fetcher = useFetcher();
  const [locale, setLocale] = useState(data.locale || "en");
  // When loader locale changes (e.g. after login), sync state
  useEffect(() => {
    if (!data?.locale) return;
    setLocale(data.locale);
    void (async () => {
		await i18next.changeLanguage(data.locale);
    })();
  }, [data.locale]);
  const toggleLanguage = () => {
    const newLocale = locale === "en" ? "de" : "en"; // Toggle between "en" and "de"
    setLocale(newLocale);
    void i18next.changeLanguage(newLocale); // Change the language in the app
    void fetcher.submit(
      { language: newLocale },
      { method: "post", action: "/action/set-language" }, // Persist the new language
    );
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="hover:bg-transparent dark:hover:text-white hover:text-black"
    >
      <Globe/>{locale === "de" ? <p>DE</p> : <p>EN</p>}
    </Button>
  );
}
