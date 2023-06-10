import { Feature } from "~/lib/directus";

export default function FeatureCard(item: Feature) {
  return (
    <div
      key={item.id}
      className="dark:border-green-200 dark:bg-gray-100/[rgba(217,217,217,0.1)] flex flex-col items-center justify-center rounded-lg border-4 border-solid border-green-100 p-4 text-center text-gray-300 dark:text-gray-100"
    >
      <div className="dark:text-green-200 pb-4 font-serif text-2xl font-extrabold text-green-100 subpixel-antialiased">
        {item.title}
      </div>
      <div className="text-center text-lg">{item.description}</div>
      <div className="pt-4">
        <img src={`${ENV.DIRECTUS_URL}/assets/${item.icon}`} alt="api_svg" />
      </div>
    </div>
  );
}
