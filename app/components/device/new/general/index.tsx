
export interface GeneralProps {
  data: any;
}

export default function General({ data }: GeneralProps) {
  return (
    <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Profile</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          This information will be displayed publicly so be careful what you
          share.
        </p>
      </div>

      <div className="mt-6 space-y-6 sm:mt-5 sm:space-y-5">
        <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
          >
            Name of your station
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
              Exposure
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="max-w-lg">
              <p className="text-sm text-gray-500">
                This is how your device is exposed/placed.
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center">
                  <input
                    id="exposure-indoor"
                    name="exposure"
                    value="indoor"
                    defaultChecked={data.exposure === "indoor"}
                    type="radio"
                    required
                    className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
                  />
                  <label
                    htmlFor="exposure-indoor"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    Indoor
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="exposure-outdoor"
                    name="exposure"
                    value="outdoor"
                    defaultChecked={data.exposure === "outdoor"}
                    type="radio"
                    required
                    className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
                  />
                  <label
                    htmlFor="exposure-outdoor"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    Outdoor
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="exposure-mobile"
                    name="exposure"
                    value="mobile"
                    defaultChecked={data.exposure === "mobile"}
                    type="radio"
                    required
                    className="focus:ring-indigo-500 text-indigo-600 h-4 w-4 border-gray-300"
                  />
                  <label
                    htmlFor="exposure-mobile"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    Mobile
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
          >
            Group ID (optional)
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

        {/* <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                  <label
                    htmlFor="cover-photo"
                    className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                  >
                    Cover photo
                  </label>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <div className="flex max-w-lg justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pb-6 pt-5">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="text-indigo-600 hover:text-indigo-500 focus-within:ring-indigo-500 relative cursor-pointer rounded-md bg-white font-medium focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="hidden"
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                        <p className="text-xs italic text-gray-500">
                          Not implemented
                        </p>
                      </div>
                    </div>
                  </div>
                </div> */}
      </div>
    </div>
  );
}
