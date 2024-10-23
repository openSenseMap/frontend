import { Link } from "@remix-run/react";

export default function Home() {
  return (
    <div>
      <div className="w-10 h-10 pointer-events-auto">
        <Link to="/">
          <button
            type="button"
            className="w-10 h-10 rounded-full text-black hover:bg-gray-100 bg-white shadow-xl border border-gray-100"
          >
            <img
              src="/logo.png"
              alt="openSenseMapLogo"
              className="w-7 h-7 mx-auto"
            />
          </button>
        </Link>
      </div>
    </div>
  );
}
