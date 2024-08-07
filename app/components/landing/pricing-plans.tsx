import { Gift, Star } from "lucide-react";

export default function PricingPlans() {
  return (
    <>
      <section id="pricing" className="border-t border-gray-200 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold">Pricing</h2>
            <p className="mt-2 text-lg text-gray-600">
              Just kidding, openSenseMap is free and open-source. <br></br>
              You can still make your contribution.
            </p>
          </div>
          <div className="flex justify-center mt-4 gap-5">
            <div id="left" className="flex flex-col gap-3">
              <a
                href="http://github.com/openSenseMap/frontend"
                rel="noreferrer noopener nofollow"
                target="_blank"
                className="flex items-center justify-center border-2 border-solid rounded-sm px-4 py-2 hover:cursor-pointer"
              >
                <Star className="h-4 w-4 mr-2" />
                Give us a star
              </a>
            </div>
            <div id="right" className="flex flex-col gap-3 ">
              <a
                href="https://www.betterplace.org/de/projects/89947-opensensemap-org-die-freie-karte-fuer-umweltdaten"
                rel="noreferrer noopener nofollow"
                target="_blank"
                className="flex items-center justify-center border-2 border-solid rounded-sm px-4 py-2 hover:cursor-pointer"
              >
                <Gift className="h-4 w-4 mr-2" />
                Become a sponsor
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
