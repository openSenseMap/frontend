import { Link, Outlet, useLocation } from "@remix-run/react";

// function closeSidebar() {
//     let sidebar = document.getElementById("sidebar");
//     let state = sidebar?.getAttribute("data-state");
//     if (state === "open") {
//         sidebar?.setAttribute("data-state", "closed");
//     }
//     if (state === "closed") {
//         sidebar?.setAttribute("data-state", "open");
//     }
// }

export default function Sidebar() {
  let url = useLocation().state;

  return (
    <div className="flex h-full w-full">
      <Link to={url}>
        <div className="fixed inset-0 z-40 h-full w-full bg-black opacity-25" />
      </Link>
      <div
        id="sidebar"
        data-state="open"
        className="fixed inset-y-0 right-0 z-50 h-[100%] w-1/2 rounded-l-[1.25rem] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none data-[state=open]:animate-sidebarOpen data-[state=closed]:animate-sidebarClose"
      >
        <Link to="impressum">Impressum</Link>
        <Link to={url}>
          <button
            className="absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] items-center justify-center"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="mx-auto h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </Link>
        <Outlet />
      </div>
    </div>
  );
}
