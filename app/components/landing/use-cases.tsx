import type { UseCase } from "~/lib/directus";
import UseCaseCarousel from "./use-cases-carousel";

type UseCaseProps = {
  data: UseCase[];
};

export default function UseCases({ data }: UseCaseProps) {
  return (
    <div id="useCases" className="flex h-full items-center justify-center">
      <div className="flex w-full flex-col">
        <div className="flex items-center justify-center pb-10 text-center">
          <p className="dark:text-green-200 font-serif text-6xl font-black text-green-100 subpixel-antialiased">
            Use Cases
          </p>
        </div>
        <div className="flex flex-wrap justify-around">
          <UseCaseCarousel data={data} />
        </div>
      </div>
    </div>
  );
}
