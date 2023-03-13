import { Link } from "@remix-run/react";

export default function Preview() {
  return (
    <div className="h-full">
      <div className="absolute left-24 top-1/4 w-1/2">
        <p className="font-serif text-6xl font-black text-green-500 subpixel-antialiased">
          openSenseMap
        </p>
        <div className="relative left-36 top-8 w-3/4 font-sans text-lg xl:w-full xl:text-2xl">
          <p className="font-extrabold text-gray-500">
            Die offene Plattform für Umweltdaten
          </p>
          <p className="pt-2 text-gray-400">
            Die wahrscheinlich größte offene Plattform für Umwelt- und
            Sensordaten weltweit ermöglicht es allen Menschen kostenfrei auf
            umfangreiche Daten zuzugreifen, diese zu analysieren und eigene
            Messungen zu veröffentlichen. Dadurch ist ein einzigartiger
            Datensatz mit Echtzeitdaten überall auf der Welt entstanden, der
            nachprüfbare lokale wie globale Fakten zu Umweltphänomenen wie dem
            Klimawandel liefert.
          </p>
          <Link to="/explore" prefetch="intent">
            <button className="mt-2 rounded-lg hover:border-l-2 hover:border-t-2 hover:border-b-4 hover:border-r-4 border-solid border-green-500 p-1 text-gray-400 border-l-4 border-t-4 border-b-8 border-r-8">
              access OSEM
            </button>
          </Link>
        </div>
      </div>
      <div className="absolute right-0 top-0 bottom-0 -z-50">
        <img
          src="/landing/screenshot_osem.png"
          alt="osem_screenshot"
          className="h-full rounded-l-full"
        />
      </div>
    </div>
  );
}
