import { X } from "lucide-react";
import { useNavigate } from "react-router";
import { Alert, AlertDescription } from "./ui/alert";

export default function ErrorMessage() {
  let navigate = useNavigate();
  const goBack = () => navigate(-1);

  return (
    <Alert className="w-1/2 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95">
      <div className="flex items-center justify-end">
        <X
          className="cursor-pointer h-4 w-4"
          onClick={() => {
            void goBack();
          }}
        />
      </div>
      <p className="text-lg text-center p-2">
        Oh no, this shouldn't happen, but don't worry, our team is on the case!
      </p>
      <AlertDescription>
        <p className="p-2 text-md text-center">
          Add some info here.
        </p>
      </AlertDescription>
    </Alert>
  );
}
