import { InfoIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

export interface GeneralProps {
  data: any;
}

export default function General({ data }: GeneralProps) {
  const { t } = useTranslation("newdevice");
  
  return (
    <div className="space-y-4 pt-4">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {t("general")}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {t("general_text")}
        </p>
      </div>

      <div className="py-2">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>{t("general_info_text")}</AlertDescription>
        </Alert>
      </div>

      <div className="mt-6 space-y-6 sm:mt-5 sm:space-y-5">
        <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
          >
            {t("station_name")}
          </label>
          <div className="mt-1 sm:col-span-2 sm:mt-0">
            <div className="flex max-w-lg rounded-md shadow-sm">
              <input
                type="text"
                name="name"
                id="name"
                required
                defaultValue={data.name}
                autoComplete="name"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
          <div>
            <div
              className="text-base font-medium text-gray-900 sm:text-sm sm:text-gray-700"
              id="device-exposure"
            >
              {t("exposure")}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="max-w-lg">
              <p className="text-sm text-gray-500">
                {t("exposure_explaination")}
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center">
                  <input
                    id="exposure-indoor"
                    name="exposure"
                    value="INDOOR"
                    defaultChecked={data.exposure === "INDOOR"}
                    type="radio"
                    required
                    className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
                  />
                  <label
                    htmlFor="exposure-indoor"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    {t("indoor")}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="exposure-outdoor"
                    name="exposure"
                    value="OUTDOOR"
                    defaultChecked={data.exposure === "OUTDOOR"}
                    type="radio"
                    required
                    className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
                  />
                  <label
                    htmlFor="exposure-outdoor"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    {t("outdoor")}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="exposure-mobile"
                    name="exposure"
                    value="MOBILE"
                    defaultChecked={data.exposure === "MOBILE"}
                    type="radio"
                    required
                    className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
                  />
                  <label
                    htmlFor="exposure-mobile"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    {t("mobile")}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
          <label
            htmlFor="groupId"
            className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
          >
            Group ID ({t("optional")})
          </label>
          <div className="mt-1 sm:col-span-2 sm:mt-0">
            <div className="flex max-w-lg rounded-md shadow-sm">
              <input
                type="text"
                name="groupId"
                id="groupId"
                defaultValue={data.groupId}
                autoComplete="name"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
