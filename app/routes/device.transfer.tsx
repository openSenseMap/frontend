import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import Home from "~/components/header/home";
import { Separator } from "~/components/ui/separator";



//**********************************
export default function DeviceTransfer() {

  return (
    <div>
      <div className="pointer-events-none z-10 flex h-14 w-full p-2">
        <Home />
      </div>

      <div className="space-y-6 p-10 pb-14 mx-auto max-w-5xl font-helvetica">
        <div className="rounded text-[#676767]">
          <ArrowLeft className=" mr-2 inline h-5 w-5" />
          <Link to="/profile/me">Back to Dashboard</Link>
        </div>

        <div className="space-y-0.5">
          <h2 className="text-3xl font-bold tracking-normal ">
            Device Transfer
          </h2>
          <p className="text-muted-foreground">
            Import device into your account.
          </p>
        </div>
        <Separator />


      </div>
    </div>
  );
}