import { Link } from "@remix-run/react";

export default function Preview() {
  return (
    <div className="h-full items-center md:flex-col md:justify-between">
      <div className="mt-20 flex">
        <div className="flex flex-col md:basis-2/3">
          <p className="dark:text-green-200 pl-10 font-serif text-6xl font-black text-green-100 subpixel-antialiased">
            openSenseMap
          </p>
          <div className="w-3/4 self-start pl-52 pt-6 font-sans text-lg text-gray-300 dark:text-gray-100 xl:text-2xl">
            <p className="font-extrabold text-black">
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
              <button className="dark:border-green-200 dark:bg-green-200 mt-8 rounded-lg border-l-4 border-t-4 border-b-8 border-r-8 border-solid border-green-100 p-1 text-gray-300 dark:text-black">
                access OSEM
              </button>
            </Link>
          </div>
        </div>
        <div className="hidden md:block"></div>
        <img
          src="/landing/screenshot_osem.png"
          alt="osem_screenshot"
          className="h-full rounded-l-full"
        />
      </div>
    </div>
  );
}
