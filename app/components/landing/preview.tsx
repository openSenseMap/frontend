import { Link } from "@remix-run/react";

export default function Preview() {
  return (
    <div className="h-full items-center md:justify-between md:flex">
      <div className="md:basis-2/3 flex flex-col">
        <p className="pl-10 font-serif text-6xl font-black text-green-100 subpixel-antialiased dark:text-green-200">
          openSenseMap
        </p>
        <div className="w-3/4 pl-52 pt-6 font-sans text-lg text-gray-300 dark:text-gray-100 xl:text-2xl self-start">
          <p className="text-black font-extrabold">
            Die offene Plattform für Umweltdaten
          </p>
          <p className="pt-2">
            Die wahrscheinlich größte offene Plattform für Umwelt- und
            Sensordaten weltweit ermöglicht es allen Menschen kostenfrei auf
            umfangreiche Daten zuzugreifen, diese zu analysieren und eigene
            Messungen zu veröffentlichen. Dadurch ist ein einzigartiger
            Datensatz mit Echtzeitdaten überall auf der Welt entstanden, der
            nachprüfbare lokale wie globale Fakten zu Umweltphänomenen wie dem
            Klimawandel liefert.
          </p>
          <Link to="/explore" prefetch="intent">
            <button className="mt-8 rounded-lg border-l-4 border-t-4 border-b-8 border-r-8 border-solid border-green-100 p-1 text-gray-300 dark:border-green-200 dark:bg-green-200 dark:text-black">
              access OSEM
            </button>
          </Link>
        </div>
      </div>
      <div className="hidden md:block">
        <img
          src="/landing/screenshot_osem.png"
          alt="osem_screenshot"
          className="h-full rounded-l-full"
        />
      </div>
    </div>
  );
}
