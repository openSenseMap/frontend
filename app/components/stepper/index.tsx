import clsx from "clsx";

interface Step {
  title: string;
  longTitle?: string;
}

interface SearchProps {
  setStep: (step: number) => void;
  steps: Step[];
  activeStep: number;
}

export default function Stepper(props: SearchProps) {
  return (
    <ol className="flex w-full items-center justify-center space-x-2 rounded-lg bg-white p-3 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 sm:space-x-4 sm:p-4 sm:text-base">
      {props.steps.map((step: Step, index: number) => (
        <li
          key={index}
          onClick={() => props.setStep(index + 1)}
          className={clsx(
            props.activeStep === index ? "text-green-100" : "",
            "flex cursor-pointer items-center hover:text-green-300 text-xl font-medium"
          )}
        >
          <span className="border-blue-600 mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs dark:border-blue-500">
            {index + 1}
          </span>
          {step.title}
          {props.steps.length - 1 != index && (
            <svg
              className="ml-2 h-3 w-3 sm:ml-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 12 10"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m7 9 4-4-4-4M1 9l4-4-4-4"
              />
            </svg>
          )}
        </li>
      ))}
    </ol>
  );
}
