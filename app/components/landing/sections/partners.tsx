import { motion } from "framer-motion";
import type { Partner } from "~/lib/directus";

type PartnersProps = {
  data: Partner[];
};

export default function Partners({ data }: PartnersProps) {
  return (
    <div
      id="partners"
      className="flex h-full items-center justify-center text-xl text-gray-300 dark:text-gray-100"
    >
      <div className="flex h-full w-5/6 flex-col justify-evenly">
        <div className="flex items-center justify-center pb-10">
          <p className="dark:text-blue-200 font-serif text-6xl font-black text-blue-100 subpixel-antialiased">
            Partners
          </p>
        </div>
        <div className="flex items-center justify-center">
          {data.map((partner, index) => {
            return (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{
                  ease: "backOut",
                  duration: 0.8,
                  delay: index * 0.1,
                }}
                variants={{
                  visible: { opacity: 1, scale: 1, y: 0 },
                  hidden: { opacity: 0, scale: 0, y: 50 },
                }}
                key={index}
                className="p-8 w-48 md:w-64"
              >
                <img
                  src={`${ENV.DIRECTUS_URL}/assets/${partner.logo}`}
                  alt={partner.name}
                ></img>
              </motion.div>
            );
          })}
        </div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{
            ease: "backOut",
            duration: 0.5,
            delay: data.length * 0.1 + 0.3,
          }}
          variants={{
            visible: { opacity: 1, scale: 1, y: 0 },
            hidden: { opacity: 0, scale: 0, y: 50 },
          }}
          className="flex flex-col items-center justify-center"
        >
          <p>hosted by</p>
          <img
            src="/landing/openSenseLab_logo.png"
            alt="openSenseLab Logo"
          ></img>
        </motion.div>
      </div>
    </div>
  );
}
