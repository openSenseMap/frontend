// import { X } from "lucide-react";
// import { Alert, AlertDescription } from "./ui/alert";
// import { useNavigate } from "@remix-run/react";

// export default function ErrorMessage() {
//   let navigate = useNavigate();
//   const goBack = () => navigate(-1);

//   return (
//     <Alert className="w-1/2 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95">
//       <div className="flex items-center justify-end">
//         <X
//           className="cursor-pointer h-4 w-4"
//           onClick={() => {
//             goBack();
//           }}
//         />
//       </div>
//       <p className="text-lg text-center p-2">
//         Oh no, this shouldn't happen, but don't worry, our team is on the case!
//       </p>
//       <AlertDescription>
//         <p className="p-2 text-md text-center">
//           Add some info here.
//         </p>
//       </AlertDescription>
//     </Alert>
//   );
// }