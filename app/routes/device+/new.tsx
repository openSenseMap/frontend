import ValidationStepperForm from "~/components/device/new/new-device-stepper";
import { NavBar } from "~/components/nav-bar";

export default function NewDevice() {
  return (
    <div className="h-screen overflow-hidden">
      <NavBar />
      <div className="flex h-full overflow-auto w-full justify-center py-10 bg-gray-100 dark:bg-dark-background">
        <div className="w-full max-w-3xl rounded-lg p-6 dark:shadow-none dark:bg-transparent dark:text-dark-text">
          <ValidationStepperForm />
        </div>
      </div>
    </div>
  );
}
