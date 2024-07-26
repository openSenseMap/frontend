import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { motion } from "framer-motion";
import Features from "~/components/landing/features";
import Footer from "~/components/landing/footer";
import Header from "~/components/landing/header";
import Partners from "~/components/landing/partners";
import Stats from "~/components/landing/stats";
import Tools from "~/components/landing/tools";
import UseCases from "~/components/landing/use-cases";
import i18next from "~/i18next.server";
import type { Feature, Partner, UseCase } from "~/lib/directus";
import { getDirectusClient } from "~/lib/directus";
import { getUserId, getUserName } from "~/session.server";
import { useTranslation } from "react-i18next";
// import Donate from "~/components/landing/donate";
import PricingPlans from "~/components/landing/pricing-plans";

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

  return json({
    useCases: useCasesResponse.data,
    features: featuresResponse.data,
    partners: partnersResponse.data,
    stats: stats,
    header: { userId: userId, userName: userName },
    locale: locale,
  });
};

export default function Index() {
  const { useCases, features, partners, stats } = useLoaderData<{
    useCases: UseCase[];
    features: Feature[];
    partners: Partner[];
    stats: number[];
  }>();

  const { t } = useTranslation("landing");

  return (
    <div className="min-h-full bg-white dark:bg-black">
      <header>
        <Header />
      </header>
      <main>
        <div className="overflow-hidden pt-8 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
              <div className="relative z-10 mx-auto max-w-2xl lg:col-span-7 lg:max-w-none lg:pt-6 xl:col-span-6">
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
                        <button className="dark:border-light-blue dark:bg-dark-blue mt-8 rounded-lg border-b-8 border-l-4 border-r-8 border-t-4 border-solid border-light-blue p-2 text-light-blue transition-all hover:scale-105 hover:bg-light-blue hover:text-white dark:bg-blue-100 dark:text-white">
                          {t("donate")}
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
                    <Link to="/explore" prefetch="intent">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        <button className="dark:border-dark-green mt-8 rounded-lg border-b-8 border-l-4 border-r-8 border-t-4 border-solid border-light-green p-2 text-light-green transition-all hover:bg-light-green hover:text-white dark:bg-light-green dark:text-white">
                          {t("explore")}
                        </button>
                      </motion.div>
                    </Link>
                  </motion.div>
                </div>
              </div>
              <div className="relative mt-10 sm:mt-20 lg:col-span-5 lg:row-span-2 lg:mt-0 xl:col-span-6">
                <div className="stroke-gray-300/70 absolute right-0 top-4 h-[1026px] w-[1026px] translate-x-1/2 [mask-image:linear-gradient(to_bottom,white_20%,transparent_75%)] sm:top-16 sm:translate-x-1/2 lg:-top-16 lg:mr-12 xl:-top-14 xl:mr-0">
                  <img
                    src="/landing/screenshot_osem.png"
                    alt="osem_screenshot"
                    className="h-full rounded-l-full"
                  />
                </div>
                <div className="-mx-4 h-[448px] px-9 [mask-image:linear-gradient(to_bottom,white_60%,transparent)] sm:mx-0 lg:absolute lg:-inset-x-10 lg:-bottom-20 lg:-top-10 lg:h-auto lg:px-0 lg:pt-10 xl:-bottom-32"></div>
              </div>
              <div className="relative -mt-4 lg:col-span-7 lg:mt-0 xl:col-span-6">
                <Stats {...stats} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <section className="py-20 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Features data={features} />
        </div>
      </section>
      <section className="py-20 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tools />
        </div>
      </section>
      <section className="py-20 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PricingPlans />
        </div>
      </section>
      <section className="py-20 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <UseCases data={useCases} />
        </div>
      </section>
      <section className="pt-20 sm:pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Partners data={partners} />
        </div>
      </section>
      {/* <section className="py-20 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Donate />
        </div>
      </section> */}
      <footer className="">
        <Footer />
      </footer>
    </div>
  );
}
