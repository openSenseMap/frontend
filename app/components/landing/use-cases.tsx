import type { UseCase } from "~/lib/directus";

type UseCaseProps = {
  data: UseCase[]
}

export default function UseCases({data}: UseCaseProps) {
  return (
    <div id="useCases" className="flex h-full items-center justify-center">
      <div className="flex w-5/6 flex-col">
        <div className="flex items-center justify-center pb-10">
          <p className="font-serif text-6xl font-black text-green-100 subpixel-antialiased dark:text-green-200">
            Use Cases
          </p>
        </div>
        <div className="flex flex-wrap justify-around">
          {data.map((useCase, index) => {
            return (
              <div
                key={index}
                className="flex w-full flex-col items-center rounded-2xl border-4 border-solid border-green-100 pb-6 px-6 text-gray-300 dark:border-green-200 dark:text-gray-100 md:m-4"
              >
                <img
                  className="rounded-t-xl"
                  src={`${ENV.DIRECTUS_URL}/assets/${useCase.image}`}
                  alt="usecase"
                />
                <div className="py-4 font-serif text-2xl font-extrabold text-green-100 subpixel-antialiased dark:text-green-200">
                  {useCase.title}
                </div>
                <div className="text-center text-lg">{useCase.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}