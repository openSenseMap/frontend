const features = [
  {
    title: "API for all",
    description:
      "Die wahrscheinlich größte offene Plattform für Umwelt- und Sensordaten weltweit ermöglicht es allen Menschen kostenfrei auf umfangreiche Daten zuzugreifen, diese zu analysieren. Typography",
    icon: "/landing/api.svg",
  },
  {
    title: "Open data",
    description:
      "Die wahrscheinlich größte offene Plattform für Umwelt- und Sensordaten weltweit ermöglicht es allen Menschen kostenfrei auf umfangreiche Daten zuzugreifen, diese zu analysieren. Typography",
    icon: "/landing/open-cardboard-box.png",
  },
  {
    title: "Free access",
    description:
      "Die wahrscheinlich größte offene Plattform für Umwelt- und Sensordaten weltweit ermöglicht es allen Menschen kostenfrei auf umfangreiche Daten zuzugreifen, diese zu analysieren. Typography",
    icon: "/landing/free.svg",
  },
  {
    title: "Free registration",
    description:
      "Die wahrscheinlich größte offene Plattform für Umwelt- und Sensordaten weltweit ermöglicht es allen Menschen kostenfrei auf umfangreiche Daten zuzugreifen, diese zu analysieren. Typography",
    icon: "/landing/tasks.svg",
  },
];

export default function Features() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-5/6">
        <div className="flex items-center justify-center pb-20">
          <p className="font-serif text-6xl font-black text-green-500 subpixel-antialiased">
            Features
          </p>
        </div>
        <div className="flex flex-wrap justify-around">
          {features.map((feature, index) => {
            return (
              <div key={index} className="flex w-full flex-col items-center justify-center rounded-2xl border-l-2 border-t-2 border-b-8 border-r-8 border-solid border-green-500 p-4 text-gray-400 md:m-4 md:w-1/3 xl:w-1/6">
                <div className="pb-4 font-serif text-2xl font-extrabold text-green-500 subpixel-antialiased">
                  {feature.title}
                </div>
                <div className="text-center text-lg">{feature.description}</div>
                <div className="pt-4">
                  <img src={feature.icon} alt="api_svg" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
