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
    <ol className="flex items-center w-full p-3 space-x-2 text-sm font-medium text-center  bg-white rounded-lg shadow-sm dark:text-gray-400 sm:text-base dark:bg-gray-800 dark:border-gray-700 sm:p-4 sm:space-x-4">
      { props.steps.map((step:Step, index: number) => (
        <li key={index} onClick={() => props.setStep(index+1)} className={clsx((props.activeStep === index ? 'text-green-100': '' ), "flex items-center cursor-pointer hover:text-green-300")}>
          <span className="flex items-center justify-center w-5 h-5 mr-2 text-xs border border-blue-600 rounded-full shrink-0 dark:border-blue-500">
              {index+1}
          </span>
          {step.title}
          {props.steps.length -1 != index && (
          <svg className="w-3 h-3 ml-2 sm:ml-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m7 9 4-4-4-4M1 9l4-4-4-4"/>
          </svg>
          )}
        </li>
      ) )}
    </ol>
  );
}
