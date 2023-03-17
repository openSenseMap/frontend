const useCases = [
  {
    title: "MINT projects",
    description:
      "Mit unserer Bildungsarbeit wecken wir mit der openSenseMap.org Begeisterung für MINT-Fächer.",
    image: "/landing/usecase.png",
  },
  {
    title: "MINT projects",
    description:
      "Mit unserer Bildungsarbeit wecken wir mit der openSenseMap.org Begeisterung für MINT-Fächer.",
    image: "/landing/usecase.png",
  },
  {
    title: "MINT projects",
    description:
      "Mit unserer Bildungsarbeit wecken wir mit der openSenseMap.org Begeisterung für MINT-Fächer.",
    image: "/landing/usecase.png",
  },
  {
    title: "MINT projects",
    description:
      "Mit unserer Bildungsarbeit wecken wir mit der openSenseMap.org Begeisterung für MINT-Fächer.",
    image: "/landing/usecase.png",
  },
];

export default function UseCases() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex w-5/6 flex-col">
        <div className="flex items-center justify-center pb-10">
          <p className="font-serif text-6xl font-black text-green-100 dark:text-green-200 subpixel-antialiased">
            Use Cases
          </p>
        </div>
        <div className="flex flex-wrap justify-around">
          {useCases.map((useCase, index) => {
            return (
              <div key={index} className="flex w-full flex-col items-center justify-start rounded-2xl border-4 border-solid border-green-100 dark:border-green-200 pb-6 text-gray-300 dark:text-gray-100 md:m-4 md:w-1/3 xl:w-1/6">
                <img
                  className="rounded-t-xl"
                  src={useCase.image}
                  alt="usecase"
                />
                <div className="py-4 font-serif text-2xl font-extrabold text-green-100 dark:text-green-200 subpixel-antialiased">
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
