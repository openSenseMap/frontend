import type { LoaderFunctionArgs } from "@remix-run/node";
import { data } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { motion } from "framer-motion";
import Features from "~/components/landing/sections/features";
import Footer from "~/components/landing/footer";
import Header from "~/components/landing/header/header";
import Partners from "~/components/landing/sections/partners";
import Stats from "~/components/landing/stats";
import i18next from "~/i18next.server";
import type { Partner } from "~/lib/directus";
import { getDirectusClient } from "~/lib/directus";
import { getUserId, getUserName } from "~/session.server";
import { useTranslation } from "react-i18next";
import PricingPlans from "~/components/landing/sections/pricing-plans";
import Integrations from "~/components/landing/sections/integrations";
import Connect from "~/components/landing/sections/connect";
import { GlobeComponent } from "~/components/landing/globe.client";
import { useMediaQuery } from "@mantine/hooks";
import { getLatestDevices } from "~/models/device.server";

const sections = [
  {
    title: "Features",
    description:
      "The openSenseMap platform has a lot to offer that makes discoverability and sharing of environmental and sensor data easy.",
    component: Features,
  },
  {
    title: "Connect",
    description:
      "Connect your devices to the openSenseMap platform and start sharing your environmental data with the world.",
    component: Connect,
  },
  {
    title: "Integrations",
    description:
      "Integrate your devices with the openSenseMap platform and start sharing your environmental data with the world.",
    component: Integrations,
  },
  {
    title: "Pricing",
    description:
      "Choose the right pricing plan for your needs and start sharing your environmental data with the world.",
    component: PricingPlans,
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let locale = await i18next.getLocale(request);
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

  //* Get user Id from session
  const userId = await getUserId(request);
  const userName = await getUserName(request);

  const stats = await fetch("https://api.opensensemap.org/stats").then(
    (res) => {
      return res.json();
    },
  );

  const latestDevices = await getLatestDevices();

  return data({
    useCases: useCasesResponse.data,
    features: featuresResponse.data,
    partners: partnersResponse.data,
    stats: stats,
    header: { userId: userId, userName: userName },
    locale: locale,
    latestDevices: latestDevices,
  });
};

export default function Index() {
  const { partners, stats, latestDevices } = useLoaderData<{
    partners: Partner[];
    stats: number[];
    latestDevices: any[];
  }>();

  const { t } = useTranslation("landing");

  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div
      className="w-screen h-screen bg-white dark:bg-black scroll-snap-container"
      style={{
        scrollSnapType: "y mandatory",
        overflowY: "scroll",
        height: "100vh",
      }}
    >
      <header className="w-full z-10">
        <Header />
      </header>
      <main>
        <div
          id="firstSection"
          className="min-h-[calc(100vh-8rem)] flex flex-col justify-center mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-snap-section"
          style={{
            minHeight: "calc(100vh - 8rem)",
            scrollSnapAlign: "center",
          }}
        >
          <div className="flex items-center justify-between w-full px-8">
            <div className="w-full md:w-1/2">
              <h1 className="text-5xl font-bold tracking-tight text-light-green dark:text-dark-green">
                openSenseMap
              </h1>
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ease: "easeInOut", duration: 0.5 }}
              >
                <p className="ml-6 mt-6 text-lg text-gray-600 dark:text-gray-100">
                  {t("introduction")}
                </p>
              </motion.div>
              <div className="mt-8 flex items-center justify-around gap-x-6 gap-y-4 text-xl">
                <motion.div
                  initial={{ opacity: 0, y: 100, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2,
                    type: "spring",
                    stiffness: 50,
                  }}
                >
                  <Link to="/explore" prefetch="intent">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                    >
                      <button className="dark:border-dark-green mt-8 rounded-lg border-b-8 border-l-4 border-r-8 border-t-4 border-solid border-light-green p-2 text-light-green transition-all hover:bg-light-green hover:text-white dark:bg-dark-green dark:text-white">
                        {t("explore")}
                      </button>
                    </motion.div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 100, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.5,
                    type: "spring",
                    stiffness: 50,
                  }}
                >
                  <Link
                    to="https://www.betterplace.org/de/projects/89947-opensensemap-org-die-freie-karte-fuer-umweltdaten"
                    target="_blank"
                    rel="noopener noreferrer"
                    prefetch="intent"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                    >
                      <button className="dark:border-dark-blue dark:bg-dark-blue mt-8 rounded-lg border-b-8 border-l-4 border-r-8 border-t-4 border-solid border-light-blue p-2 text-light-blue transition-all hover:scale-105 hover:bg-light-blue hover:text-white dark:text-white">
                        {t("donate")}
                      </button>
                    </motion.div>
                  </Link>
                </motion.div>
              </div>
            </div>
            {isDesktop && (
              <div className="w-1/3 cursor-pointer">
                <GlobeComponent latestDevices={latestDevices}/>
              </div>
            )}
          </div>
          {isDesktop && (
            <div className="w-full">
              <Stats {...stats} />
            </div>
          )}
        </div>
        {sections.map((section, index) => {
          const Component = section.component;
          return (
            <div
              key={section.title}
              className="h-screen flex justify-center items-center mx-32 scroll-snap-section"
              style={{
                scrollSnapAlign: "center",
              }}
            >
              <Component />
            </div>
          );
        })}
        <div
          className="h-screen flex flex-col justify-center items-center mx-32 scroll-snap-section"
          style={{
            scrollSnapAlign: "center",
          }}
        >
          <Partners data={partners} />
          <Footer />
        </div>
      </main>
    </div>
  );
}
