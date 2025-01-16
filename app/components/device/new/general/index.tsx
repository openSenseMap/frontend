import { InfoIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import TagsInput from "react-tagsinput";
import { useField } from "remix-validated-form";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import "react-tagsinput/react-tagsinput.css";
import { useState } from "react";

export interface GeneralProps {
  data: any;
}

export default function General({ data }: GeneralProps) {
  const { t } = useTranslation("newdevice");

  const nameField = useField("name");
  const exposureField = useField("exposure");
  const groupIdField = useField("groupId");

  const [tags, setTags] = useState(
    data.groupId ? data.groupId.split(", ") : [],
  );

  const handleChange = (tags: any) => {
    setTags(tags);
  };

  return (
    <div className="space-y-4 pt-4">
      <div>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-dark-text">
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

      <div className="mt-6 sm:mt-5">
        <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 dark:text-dark-text sm:mt-px sm:pt-2"
          >
            {t("station_name")}
          </label>
          <div className="mt-1 sm:col-span-2 sm:mt-0">
            <div className="flex max-w-lg rounded-md shadow-sm">
              <input
                {...nameField.getInputProps({ id: "name" })}
                type="text"
                name="name"
                id="name"
                required
                defaultValue={data.name}
                autoComplete="name"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 sm:text-sm dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
              />
            </div>
            {nameField.error && (
              <span className="ml-1 text-sm font-medium text-red-500">
                {nameField.error}
              </span>
            )}
          </div>
        </div>

        <div
          data-error={nameField.error !== undefined}
          className="pt-5 data-[error=false]:mt-6 sm:grid sm:grid-cols-3 sm:items-start sm:border-t sm:border-gray-200"
        >
          <div>
            <div
              className="text-base font-medium text-gray-900 sm:text-sm sm:text-gray-700 dark:text-dark-text"
              id="device-exposure"
            >
              {t("exposure")}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="max-w-lg">
              <p className="text-sm text-gray-500 dark:text-dark-text">
                {t("exposure_explaination")}
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center">
                  <input
                    {...exposureField.getInputProps({ id: "exposure" })}
                    id="exposure-indoor"
                    name="exposure"
                    value="INDOOR"
                    defaultChecked={data.exposure === "INDOOR"}
                    type="radio"
                    required
                    className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                  />
                  <label
                    htmlFor="exposure-indoor"
                    className="ml-3 block text-sm font-medium text-gray-700 dark:text-dark-text"
                  >
                    {t("indoor")}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    {...exposureField.getInputProps({ id: "exposure" })}
                    id="exposure-outdoor"
                    name="exposure"
                    value="OUTDOOR"
                    defaultChecked={data.exposure === "OUTDOOR"}
                    type="radio"
                    required
                    className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                  />
                  <label
                    htmlFor="exposure-outdoor"
                    className="ml-3 block text-sm font-medium text-gray-700 dark:text-dark-text"
                  >
                    {t("outdoor")}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    {...exposureField.getInputProps({ id: "exposure" })}
                    id="exposure-mobile"
                    name="exposure"
                    value="MOBILE"
                    defaultChecked={data.exposure === "MOBILE"}
                    type="radio"
                    required
                    className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                  />
                  <label
                    htmlFor="exposure-mobile"
                    className="ml-3 block text-sm font-medium text-gray-700 dark:text-dark-text"
                  >
                    {t("mobile")}
                  </label>
                </div>
              </div>
              {exposureField.error && (
                <span className="ml-2 mt-2 text-sm font-medium text-red-500">
                  {exposureField.error}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          data-exposureerror={exposureField.error !== undefined}
          data-groupiderror={groupIdField.error !== undefined}
          className="pt-5 data-[exposureerror=false]:mt-6 data-[groupiderror=false]:mb-6 sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200"
        >
          <label
            htmlFor="groupId"
            className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2 dark:text-dark-text"
          >
            Group ID ({t("optional")})
          </label>
          <div className="mt-1 sm:col-span-2 sm:mt-0">
            <div className="flex max-w-lg rounded-md flex-1 border border-gray-300 focus-within:border-[3px] focus-within:border-blue-700 sm:text-sm">
              <input
                {...groupIdField.getInputProps({ id: "groupId" })}
                type="text"
                name="groupId"
                id="groupId"
                value={tags.length > 0 ? tags.join(", ") : ""}
                className="hidden"
                disabled={tags.length === 0}
              />
              <TagsInput
                value={tags}
                onChange={handleChange}
                addKeys={[9, 13, 32, 188]}
                className="block w-full flex-1 rounded-md sm:text-sm"
                focusedClassName=""
                tagProps={{
                  className:
                    "bg-blue-700 inline-block m-1 p-1 rounded-md inline-flex items-center text-white",
                  classNameRemove:
                    "h-5 w-5 text-black ml-1 bg-white cursor-pointer rounded-full after:content-['_×'] text-center",
                }}
                inputProps={{
                  className:
                    "border-0 rounded-md focus:ring-0 focus:border-0 w-fit m-1 p-1 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300",
                  placeholder: "Add a Group ID",
                }}
              />
            </div>
            {groupIdField.error && (
              <span className="ml-1 text-sm font-medium text-red-500">
                {groupIdField.error}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
