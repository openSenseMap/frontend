import { Link, NavLink, Outlet } from "@remix-run/react";
import { createContext, useState } from "react";
import { useTranslation } from "react-i18next";

interface FeaturesContextType {
  features: any;
  setFeatures: (features: any) => void;
}

export const FeatureContext = createContext<FeaturesContextType>({
  features: {},
  setFeatures: () => {},
});

export default function CreateCampaignPage() {
  const { t } = useTranslation("create-campaign");
  const links = [
    {
      name: t("step") + " 1",
      link: "/create/area",
    },
    {
      name: t("step") + " 2",
      link: "/create/form",
    },
  ];
  const [features, setFeatures] = useState({});
  return (
    <div className="h-full w-full">
      <main>
        <div className="hidden w-full items-center text-gray-400 dark:text-gray-300 md:order-1 md:flex">
          <Link to="/" className="m-2">
            <img src="/logo.png" className="mr-3 h-6 sm:h-9" alt="osem Logo" />
          </Link>
          <ul className="mt-4 flex flex-row p-4 md:space-x-8 md:text-lg">
            {links.map((item, index) => {
              return (
                <li key={index}>
                  <NavLink
                    to={item.link}
                    className={({ isActive }) =>
                      isActive
                        ? "dark:md:hover:text-green-200 block rounded py-2 pl-3 pr-4 underline md:p-0 md:font-bold md:hover:text-green-100"
                        : "dark:md:hover:text-green-200 block rounded py-2 pl-3 pr-4 md:p-0 md:font-thin md:hover:text-green-100"
                    }
                  >
                    {item.name}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        <FeatureContext.Provider value={{ features, setFeatures }}>
          <Outlet />
        </FeatureContext.Provider>
      </main>
    </div>
  );
}
