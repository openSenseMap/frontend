export default function Info() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h1 className="dark:text-green-200 mt-8 text-4xl font-bold text-green-100 ">
        Welcome
      </h1>
      <h2 className="dark:text-green-200 text-xl font-semibold text-green-100 ">
        to the
      </h2>
      <h1 className="dark:text-green-200 text-4xl text-green-100">
        OpenSenseMap Campaign Manager
      </h1>
      <p className="mb-6 text-center text-lg font-semibold ">
        Create or contribute to campaigns on the openSenseMap and connect with
        fellow citizen scientists to unite efforts for a shared goal!
      </p>
      <a
        href="./explore"
        className="rounded-full bg-blue-700 px-6 py-2 text-lg text-white "
      >
        Explore Campaigns
      </a>
    </div>
  );
}
