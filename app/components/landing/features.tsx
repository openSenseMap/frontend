import type { Feature } from "~/lib/directus";

type FeaturesProps = {
  data: Feature[]
}

export default function Features({data}: FeaturesProps) {
  return (
    <div id="features" className="flex h-full items-center justify-center">
      <div className="w-5/6">
        <div className="flex items-center justify-center pb-10">
          <p className="font-serif text-6xl font-black text-green-100 subpixel-antialiased dark:text-green-200">
            Features
          </p>
        </div>
        <div className="flex">
          {data.map((feature, index) => {
            return (
              <div
                key={index}
                className="flex items-center flex-col justify-center rounded-2xl border-4 border-solid border-green-100 p-4 text-gray-300 dark:border-green-200 dark:text-gray-100 md:m-4 dark:bg-gray-100/[rgba(217,217,217,0.1)]"
              >
                <div className="pb-4 font-serif text-2xl font-extrabold text-green-100 subpixel-antialiased dark:text-green-200">
                  {feature.title}
                </div>
                <div className="text-center text-lg">{feature.description}</div>
                <div className="pt-4">
                  <img src={`${ENV.DIRECTUS_URL}/assets/${feature.icon}`} alt="api_svg" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
