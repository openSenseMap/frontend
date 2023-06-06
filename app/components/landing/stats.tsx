import AnimatedCounter from "../ui/animated-counter";

const stats = [
  {
    id: 1,
    name: "Devices",
    value: 11,
    unit: "K",
  },
  {
    id: 2,
    name: "Measurements (total)",
    value: 1148,
    unit: "Mio.",
  },
  {
    id: 3,
    name: "Measurements per minute",
    value: 9,
    unit: "K",
  },
];

export default function Stats() {
  return (
    <div className="mx-auto px-4 py-16 sm:max-w-xl md:max-w-full md:px-24 lg:max-w-screen-xl lg:px-8 lg:py-24">
      <div className="row-gap-8 grid gap-10 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.id} className="flex flex-col items-center text-center">
            <div className="flex-direction-row justify-content-center align-items-center flex">
              <h6 className="text-5xl font-bold text-green-100">
                <AnimatedCounter from={0} to={stat.value} />
                {/* {stat.value} */}
              </h6>
              <h6 className="text-5xl font-bold text-green-100">{stat.unit}</h6>
            </div>
            <p className="font-bold">{stat.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
