import type { UseCase } from "~/lib/directus";

export default function UseCaseCard(item: UseCase) {
  return (
    <div
      key={item.id}
      className="dark:bg-gray-900 flex flex-col items-center justify-center rounded-xl border-4 border-solid border-light-green bg-white p-4 text-center text-4xl text-gray-300 shadow-[5px_5px_rgba(0,_98,_90,_0.4),_8px_8px_rgba(0,_98,_90,_0.3),_11px_11px_rgba(0,_98,_90,_0.2),_14px_14px_rgba(0,_98,_90,_0.1),_17px_17px_rgba(0,_98,_90,_0.05)] dark:text-gray-100"
    >
      <div className="dark:text-green-200 pb-4 font-serif text-2xl font-extrabold text-light-green subpixel-antialiased">
        {item.title}
      </div>
      <div className="text-center text-lg">{item.description}</div>
      <div className="pt-4">
        <img src={`${ENV.DIRECTUS_URL}/assets/${item.image}`} alt="api_svg" />
      </div>
    </div>
  );
}
