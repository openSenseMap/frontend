import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Features from "~/components/landing/features";
import Footer from "~/components/landing/footer";
import Header from "~/components/landing/header";
import Partners from "~/components/landing/partners";
import Preview from "~/components/landing/preview";
import Tools from "~/components/landing/tools";
import UseCases from "~/components/landing/use-cases";
import i18next from "~/i18next.server";
import type { Feature, Partner, UseCase } from "~/lib/directus";
import { getDirectusClient } from "~/lib/directus";
import { getUserId, getUserName } from "~/session.server";

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

  //* Get user Id from session
  const userId = await getUserId(request);
  const userName = await getUserName(request);

  return json({
    useCases: useCasesResponse.data,
    features: featuresResponse.data,
    partners: partnersResponse.data,
    header: { userId: userId, userName: userName },
  });
};

export default function Index() {
  const { useCases, features, partners, header } = useLoaderData<{
    useCases: UseCase[];
    features: Feature[];
    partners: Partner[];
    header: { userId: string, userName: string };
  }>();

  return (
    <div className="bg-white dark:bg-black">
      <div className="h-screen min-h-screen">
        <Header data={header} />
        <Preview />
      </div>
      <div className="h-screen min-h-screen">
        <Features data={features} />
      </div>
      <div className="h-screen min-h-screen">
        <Tools />
      </div>
      <div className="h-screen min-h-screen">
        <UseCases data={useCases} />
      </div>
      <div className="h-screen min-h-screen">
        <Partners data={partners} />
        <Footer />
      </div>
    </div>
  );
}
