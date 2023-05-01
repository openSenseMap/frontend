import type { Partner } from "~/lib/directus";

type PartnersProps = {
  data: Partner[]
}

export default function Partners({data}: PartnersProps) {
  return (
    <div id="partners" className="flex h-full min-h-full items-center justify-center text-gray-300 text-xl dark:text-gray-100">
      <div className="flex w-5/6 flex-col justify-evenly h-full">
        <div className="flex items-center justify-center pb-10">
          <p className="font-serif text-6xl font-black text-blue-100 subpixel-antialiased dark:text-blue-200">
            Partners
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center">
          {data.map((partner, index) => {
            return (
              <div key={index} className="w-1/5 p-8">
                <img src={`${ENV.DIRECTUS_URL}/assets/${partner.logo}`} alt={partner.name}></img>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col items-center justify-center">
          <p>hosted by</p>
          <img src="/landing/openSenseLab_logo.png" alt="openSenseLab Logo"></img>
        </div>
      </div>
    </div>
  );
}
