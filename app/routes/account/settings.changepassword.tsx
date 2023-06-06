import { Form } from "@remix-run/react";

export default function changepassword() {
  return (
    <div className="mt-14">
      <div className="grid grid-rows-1">
        <div className="flex min-h-full items-center justify-center">
          <div className="mx-auto w-full max-w-5xl font-helvetica">
            {/* Heading */}
            <div className="inline-flex">
              {/* avatar icon */}
              <div className="h-9 w-9 rotate-[270deg] overflow-hidden rounded-full leading-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.75 1.5a6.75 6.75 0 00-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 00-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 00.75-.75v-1.5h1.5A.75.75 0 009 19.5V18h1.5a.75.75 0 00.53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1015.75 1.5zm0 3a.75.75 0 000 1.5A2.25 2.25 0 0118 8.25a.75.75 0 001.5 0 3.75 3.75 0 00-3.75-3.75z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              {/* Change password title */}
              <div>
                <h1 className="ml-2 text-4xl">Change Password</h1>
              </div>
            </div>

            {/* divider */}
            <hr className="my-2 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

            {/* Form */}
            <div className="pt-4">
              <Form method="post" className="space-y-6" noValidate>
                {/* Password */}
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-base font-bold tracking-normal"
                  >
                    Current password
                  </label>

                  <div className="mt-1">
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      placeholder="Current Password"
                      // defaultValue={123}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-base placeholder-[#999]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="txt-base block font-bold tracking-normal"
                  >
                    New password
                  </label>

                  <div className="mt-1">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      placeholder="New Password"
                      // defaultValue={123}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-base placeholder-[#999]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="newPasswordConfirm"
                    className="txt-base block font-bold tracking-normal"
                  >
                    Confirm new password
                  </label>

                  <div className="mt-1">
                    <input
                      id="newPasswordConfirm"
                      name="newPasswordConfirm"
                      type="password"
                      placeholder="New Password Confirm"
                      // defaultValue={123}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-base placeholder-[#999]"
                    />
                  </div>
                </div>

                {/* divider */}
                <hr className="my-2 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

                {/* Cancel and Update buttons */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={false}
                    className="rounded border border-gray-200 py-2 px-4 text-black disabled:border-[#ccc] disabled:text-[#8a8989]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={false}
                    className="ml-3 rounded border border-gray-200 py-2 px-4 text-black disabled:border-[#ccc]  disabled:text-[#8a8989]"
                  >
                    Update
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
