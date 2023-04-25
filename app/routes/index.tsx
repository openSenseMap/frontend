import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Features from "~/components/landing/features";
import Footer from "~/components/landing/footer";
import Header from "~/components/landing/header";
import Partners from "~/components/landing/partners";
import Preview from "~/components/landing/preview";
import Tools from "~/components/landing/tools";
import UseCases from "~/components/landing/useCases";
import type { Feature, Partner, UseCase } from "~/lib/directus";
import { getDirectusClient } from "~/lib/directus";
export const loader = async () => {
  const directus = await getDirectusClient();

  const useCasesResponse = await directus.items("use_cases").readByQuery({
    fields: ["*"],
  });

  const featuresResponse = await directus.items("features").readByQuery({
    fields: ["*"],
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
    <div className="bg-white dark:bg-black">
      <div className="h-screen min-h-screen">
        <Header />
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
