import * as Dialog from '@radix-ui/react-dialog';
import { Link, useLocation } from "@remix-run/react";
import React from 'react';


export default function Menu() {

  const [isOpen, setIsOpen] = React.useState(false);
  const toggleDrawer = () => setIsOpen(!isOpen);

  const location = useLocation();


  return (
    // <div className="box-border w-10 h-10 pointer-events-auto">
    //   <Dialog.Root>
    //     <Dialog.Trigger asChild>
    //       <button type="button" className="w-10 h-10 rounded-full text-black text-center hover:bg-gray-200 bg-white">
    //         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mx-auto">
    //           <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    //         </svg>
    //       </button>
    //     </Dialog.Trigger>
    //     <Dialog.Portal>
    //       <Dialog.Overlay className="bg-black opacity-25 fixed inset-0 z-50" />
    //       <Dialog.Content className="data-[state=open]:animate-sidebarOpen data-[state=closed]:animate-sidebarClose fixed inset-y-0 right-0 w-1/2 h-[100%] rounded-l-[1.25rem] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none z-50">
    //           {/* Fill me with customized content  */}
    //           <Link to="/impressum">
    //             Impressum
    //           </Link>
    //           <Dialog.Close asChild>
    //             <button
    //               className="absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] items-center justify-center"
    //               aria-label="Close"
    //             >
    //               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mx-auto">
    //                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    //               </svg>
    //             </button>
    //           </Dialog.Close>
    //       </Dialog.Content>
    //     </Dialog.Portal>
    //   </Dialog.Root>
    // </div>

    <div className="box-border w-10 h-10 pointer-events-auto">
      <Link to="sidebar" state={location.pathname}>
        <button type="button" className="w-10 h-10 rounded-full text-black text-center hover:bg-gray-200 bg-white" onClick={toggleDrawer}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mx-auto">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </Link>
    </div>
  );
}
