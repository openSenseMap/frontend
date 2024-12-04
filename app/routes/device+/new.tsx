import ValidationStepperForm from "~/components/device/new/new-device-stepper";
import { NavBar } from "~/components/nav-bar";

export default function NewDevice() {
  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      <div className="flex-grow bg-gray-100 overflow-auto">
        <div className="flex h-full w-full justify-center py-10">
          <div className="w-full h-full max-w-3xl rounded-lg p-6 dark:shadow-none dark:bg-transparent dark:text-dark-text">
            <ValidationStepperForm />
          </div>
        </div>
      </div>
    </div>
  );
}
