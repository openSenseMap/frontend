import { Terminal, X } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import Lottie from "react-lottie";
import * as animationData from "../../public/animations/error_animation.json";
import { useNavigate } from "@remix-run/react";

export default function ErrorMessage() {
  let navigate = useNavigate();

  return (
    <div className="h-screen w-screen items-center flex justify-center z-50">
      <Alert className="w-1/2 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95">
        <div className="flex items-center justify-between">
          <Terminal className="h-4 w-4" />
          <X
            className="cursor-pointer h-4 w-4"
            onClick={() => {
              navigate("/explore");
            }}
          />
        </div>
        <p className="text-md text-center">
          Oh no, this shouldn't happen, but don't worry, our team is on the
          case!
          <br />
          For now, we'll take you back to the Explore page to ensure a smooth
          experience. 🌍
          <br />
          And just to lighten the mood, here's an animation of a dog with a
          lifebuoy to keep you company
        </p>
        <AlertDescription>
          <Lottie
            options={{
              animationData: animationData,
              autoplay: true,
              loop: true,
            }}
            height={200}
            width={200}
          />
        </AlertDescription>
      </Alert>
    </div>
  );
}
