export default function PricingPlans() {
  return (
    <>
      <section className="">
        <div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-6 lg:py-16">
          <div className="mx-auto mb-8 max-w-screen-md text-center lg:mb-12">
            <h2 className="dark:text-green-200 mb-4 font-serif text-4xl font-black text-light-green subpixel-antialiased dark:text-white">
              Designed for business teams like yours
            </h2>
            <p className="mb-5 font-light text-gray-500 dark:text-gray-400 sm:text-xl">
              Here at Flowbite we focus on markets where technology, innovation,
              and capital can unlock long-term value and drive economic growth.
            </p>
          </div>
          <div className="space-y-8 sm:gap-6 lg:grid lg:grid-cols-3 lg:space-y-0 xl:gap-10">
            {/* <!-- Pricing Card --> */}
            <div className="mx-auto flex max-w-lg flex-col rounded-lg border border-gray-100 bg-white p-6 text-center text-gray-900 shadow dark:border-gray-600 dark:bg-gray-800 dark:text-white xl:p-8">
              <h3 className="mb-4 text-2xl font-semibold text-light-green">
                Starter
              </h3>
              <p className="font-light text-gray-500 dark:text-gray-400 sm:text-lg">
                Best option for personal use & for your next project.
              </p>
              <div className="my-8 flex items-baseline justify-center">
                <span className="mr-2 text-5xl font-extrabold text-light-green">
                  $29
                </span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              {/* <!-- List --> */}
              <ul className="mb-8 space-y-4 text-left">
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>3 personal devices</span>
                </li>
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>
                    6 requests per minute
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>No setup, or hidden fees</span>
                </li>
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>
                    Premium support:{" "}
                    <span className="font-semibold">6 months</span>
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>
                    Free updates:{" "}
                    <span className="font-semibold">6 months</span>
                  </span>
                </li>
              </ul>
              <a
                href="/"
                className="hover:bg-green-200 focus:ring-grey-200 dark:focus:ring-grey-900 rounded-lg bg-light-green px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4  dark:text-white"
              >
                Get started
              </a>
            </div>
            {/* <!-- Pricing Card --> */}
            <div className="mx-auto flex max-w-lg flex-col rounded-lg border border-gray-100 bg-white p-6 text-center text-gray-900 shadow dark:border-gray-600 dark:bg-gray-800 dark:text-white xl:p-8">
              <h3 className="mb-4 text-2xl font-semibold text-light-green">
                Company
              </h3>
              <p className="font-light text-gray-500 dark:text-gray-400 sm:text-lg">
                Relevant for multiple users, extended & premium support.
              </p>
              <div className="my-8 flex items-baseline justify-center">
                <span className="mr-2 text-5xl font-extrabold text-light-green">
                  $99
                </span>
                <span
                  className="text-gray-500 dark:text-gray-400"
                >
                  /month
                </span>
              </div>
              {/* <!-- List --> */}
              <ul className="mb-8 space-y-4 text-left">
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>Individual configuration</span>
                </li>
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>No setup, or hidden fees</span>
                </li>
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>
                    Team size:{" "}
                    <span className="font-semibold">10 developers</span>
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>
                    Premium support:{" "}
                    <span className="font-semibold">24 months</span>
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>
                    Free updates:{" "}
                    <span className="font-semibold">24 months</span>
                  </span>
                </li>
              </ul>
              <a
                href="/"
                className="hover:bg-green-200 rounded-lg bg-light-green px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4 focus:ring-gray-200 dark:text-white  dark:focus:ring-gray-900"
              >
                Get started
              </a>
            </div>
            {/* <!-- Pricing Card --> */}
            <div className="mx-auto flex max-w-lg flex-col rounded-lg border border-gray-100 bg-white p-6 text-center text-gray-900 shadow dark:border-gray-600 dark:bg-gray-800 dark:text-white xl:p-8">
              <h3 className="mb-4 text-2xl font-semibold text-light-green">
                Enterprise
              </h3>
              <p className="font-light text-gray-500 dark:text-gray-400 sm:text-lg">
                Best for large scale uses and extended redistribution rights.
              </p>
              <div className="my-8 flex items-baseline justify-center">
                <span className="mr-2 text-5xl font-extrabold text-light-green">
                  $499
                </span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              {/* <!-- List --> */}
              <ul className="mb-8 space-y-4 text-left">
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>Individual configuration</span>
                </li>
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>No setup, or hidden fees</span>
                </li>
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>
                    Team size:{" "}
                    <span className="font-semibold">100+ developers</span>
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>
                    Premium support:{" "}
                    <span className="font-semibold">36 months</span>
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  {/* <!-- Icon --> */}
                  <svg
                    className="dark:text-green-400 h-5 w-5 flex-shrink-0 text-light-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>
                    Free updates:{" "}
                    <span className="font-semibold">36 months</span>
                  </span>
                </li>
              </ul>
              <a
                href="/"
                className="hover:bg-green-200 rounded-lg bg-light-green px-5 py-2.5 text-center text-sm font-medium text-white focus:ring-4 focus:ring-gray-200 dark:text-white  dark:focus:ring-gray-900"
              >
                Get started
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
