import { motion } from "framer-motion";
import AnimatedCounter from "../ui/animated-counter";
import { useTranslation } from "react-i18next";

export default function Stats(stats: number[]) {
  const { t } = useTranslation("stats");

  const osemStats = [
    {
      id: 1,
      name: "devices",
      value: stats[0] / 1000,
      unit: "K",
    },
    {
      id: 2,
      name: "measurements_total",
      value: stats[1] / 1000000,
      unit: "Mio.",
    },
    {
      id: 3,
      name: "measurements_per_minute",
      value: stats[2] / 1000,
      unit: "K",
    },
  ];

  return (
    <div className="mx-auto px-4 py-16 sm:max-w-xl md:max-w-full md:px-24 lg:max-w-screen-xl lg:px-8 lg:py-24">
      <div className="row-gap-8 grid gap-10 lg:grid-cols-3">
        {osemStats.map((stat) => (
          <div key={stat.id}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ ease: "easeInOut", duration: 0.5 }}
              variants={{
                visible: { opacity: 1, scale: 1, x: 0 },
                hidden: { opacity: 0, scale: 0, x: -100 },
              }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex-direction-row justify-content-center align-items-center flex">
                  <h6 className="text-5xl font-bold text-green-100">
                    <AnimatedCounter from={0} to={stat.value} />
                  </h6>
                  <h6 className="text-5xl font-bold text-green-100">
                    {stat.unit}
                  </h6>
                </div>
                <p className="font-bold">{t(stat.name)}</p>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
