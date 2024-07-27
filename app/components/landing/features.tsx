import type { Feature } from "~/lib/directus";

import FeaturesCarousel from "./features-carousel";

type FeaturesProps = {
  data: Feature[];
};

export default function Features({ data }: FeaturesProps) {
  return (
    <div id="features" className="flex h-full items-center justify-center">
      <div className="w-full">
        <div className="flex items-center justify-center pb-10">
          <p className="dark:text-green-200 font-serif text-6xl font-black text-light-green subpixel-antialiased">
            Features
          </p>
        </div>
        <div className="flex">
          <FeaturesCarousel data={data} />
        </div>
      </div>
    </div>
  );
}
