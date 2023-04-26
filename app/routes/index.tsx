import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import Features from "~/components/landing/features";
import Footer from "~/components/landing/footer";
import Header from "~/components/landing/header";
import Partners from "~/components/landing/partners";
import Preview from "~/components/landing/preview";
import Stats from "~/components/landing/stats";
import Tools from "~/components/landing/tools";
import UseCases from "~/components/landing/useCases";
import i18next from "~/i18next.server";
import type { Feature, Partner, UseCase } from "~/lib/directus";
import { getDirectusClient } from "~/lib/directus";

export const loader = async ({ request }: LoaderArgs) => {
  let locale = await i18next.getLocale(request);
  console.log("🌐 Locale detected: ", locale);
  const directus = await getDirectusClient();

  const useCasesResponse = await directus.items("use_cases").readByQuery({
    fields: ["*"],
    filter: {
      language: locale,
    },
  });

  const featuresResponse = await directus.items("features").readByQuery({
    fields: ["*"],
    filter: {
      language: locale,
    },
  });

  const partnersResponse = await directus.items("partners").readByQuery({
    fields: ["*"],
  });

  return json({
    useCases: useCasesResponse.data,
    features: featuresResponse.data,
    partners: partnersResponse.data,
  });
};

export default function Index() {
  const { useCases, features, partners } = useLoaderData<{
    useCases: UseCase[];
    features: Feature[];
    partners: Partner[];
  }>();

  return (
    <div className="min-h-full bg-white dark:bg-black">
      <header>
        <Header />
      </header>
      <main>
        <div className="overflow-hidden py-20 sm:py-32 lg:pb-32 xl:pb-36">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
              <div className="relative z-10 mx-auto max-w-2xl lg:col-span-7 lg:max-w-none lg:pt-6 xl:col-span-6">
                <h1 className="text-4xl font-medium tracking-tight text-gray-900">
                  openSenseMap
                </h1>
                <p className="mt-6 text-lg text-gray-600">
                  Die wahrscheinlich größte offene Plattform für Umwelt- und
                  Sensordaten weltweit ermöglicht es allen Menschen kostenfrei
                  auf umfangreiche Daten zuzugreifen, diese zu analysieren und
                  eigene Messungen zu veröffentlichen. Dadurch ist ein
                  einzigartiger Datensatz mit Echtzeitdaten überall auf der Welt
                  entstanden, der nachprüfbare lokale wie globale Fakten zu
                  Umweltphänomenen wie dem Klimawandel liefert.
                </p>
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-4">
                  <Link to="/explore" prefetch="intent">
                    <button className="dark:border-green-200 dark:bg-green-200 mt-8 rounded-lg border-l-4 border-t-4 border-b-8 border-r-8 border-solid border-green-100 p-1 text-gray-300 dark:text-black">
                      Explore
                    </button>
                  </Link>
                </div>
              </div>
              <div className="relative mt-10 sm:mt-20 lg:col-span-5 lg:row-span-2 lg:mt-0 xl:col-span-6">
                <img
                  src="/landing/screenshot_osem.png"
                  alt="osem_screenshot"
                  className="h-full rounded-l-full"
                />
              </div>
              <div className="relative -mt-4 lg:col-span-7 lg:mt-0 xl:col-span-6">
                <Stats />
              </div>
            </div>
          </div>
        </div>
      </main>
      <section className="bg-gray-900 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Features data={features} />
        </div>
      </section>
      <section className="bg-gray-900 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tools />
        </div>
      </section>
      <section className="bg-gray-900 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <UseCases data={useCases} />
        </div>
      </section>
      <section className="bg-gray-900 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Partners data={partners} />
        </div>
      </section>
      <footer className="border-t border-gray-200">
        <Footer />
      </footer>
    </div>
  );
}
