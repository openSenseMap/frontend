import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import type { Variants } from "framer-motion";
import type { Feature } from "~/lib/directus";
import FeatureCard from "./features-card";
// import { ArrowLeft, ArrowRight } from "lucide-react";

type FeaturesProps = {
  data: Feature[];
};

const variants: Variants = {
  enter: ({ direction }) => {
    return { scale: 0.2, x: direction < 1 ? 50 : -50, opacity: 0 };
  },
  center: ({ position, direction }) => {
    return {
      scale: position() === "center" ? 1 : 0.7,
      x: 0,
      zIndex: getZIndex({ position, direction }),
      opacity: 1,
    };
  },
  exit: ({ direction }) => {
    return { scale: 0.2, x: direction < 1 ? -50 : 50, opacity: 0 };
  },
};

function getZIndex({
  position,
  direction,
}: {
  position: () => string;
  direction: number;
}): number {
  const indexes: { [key: string]: number } = {
    left: direction > 0 ? 2 : 1,
    center: 3,
    right: direction > 0 ? 1 : 2,
  };
  return indexes[position()];
}

export default function FeaturesCarousel({ data }: FeaturesProps) {
  const [[activeIndex, direction], setActiveIndex] = useState<[number, number]>(
    [0, 0]
  );
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768); // Adjust the breakpoint as needed
    };

    handleResize(); // Check on initial render

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const indexInArrayScope =
    ((activeIndex % data.length) + data.length) % data.length;

  const visibleItems: Feature[] = isMobileScreen
    ? [data[indexInArrayScope]]
    : [...data, ...data].slice(indexInArrayScope, indexInArrayScope + 3);

  const handleClick = (newDirection: number): void => {
    if (isButtonDisabled) return; // Prevent clicking if the button is disabled

    setActiveIndex((prevIndex) => [prevIndex[0] + newDirection, newDirection]);
    setIsButtonDisabled(true); // Disable the button

    setTimeout(() => {
      setIsButtonDisabled(false); // Enable the button after 1 second
    }, 1000);
  };

  return (
    <div className="main-wrapper flex w-full flex-col items-center">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{
          duration: 0.5,
          delay: 0.3,
        }}
        variants={{
          visible: { opacity: 1, y: 0 },
          hidden: { opacity: 0, y: 100 },
        }}
        className="wrapper m-2 flex md:m-10"
      >
        <motion.button
          className="arrow-button"
          whileTap={{ scale: 0.8 }}
          onClick={() => handleClick(-1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{
            duration: 0.5,
            delay: 0.8,
            type: "spring",
            stiffness: 150,
          }}
          variants={{
            visible: { opacity: 1, x: 0 },
            hidden: { opacity: 0, x: -50 },
          }}
        >
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="group relative inline-flex items-center overflow-hidden rounded-full border-2 border-green-300 px-2 py-2 text-lg font-medium text-green-300 hover:bg-gray-50 hover:text-white md:px-3 md:py-3"
          >
            {/* <ArrowLeft className="z-20 h-2 w-2 hover:text-white md:h-6 md:w-6" /> */}
            <span className="duration-400 ease absolute left-0 top-1/2 block h-0 w-full bg-green-300 opacity-100 transition-all group-hover:top-0 group-hover:h-full"></span>
            <span className="ease absolute left-1/2 flex h-10 w-10 -translate-x-1/2 transform items-center justify-start duration-300 group-hover:translate-x-4"></span>
          </motion.div>
        </motion.button>
        <AnimatePresence mode="popLayout">
          {visibleItems.map((item: Feature) => {
            return (
              <motion.div
                className="card flex h-full w-full items-center justify-center"
                key={item.id}
                layout
                custom={{
                  direction,
                  position: () => {
                    if (item === visibleItems[0]) {
                      return "left";
                    } else if (item === visibleItems[1]) {
                      return "center";
                    } else {
                      return "right";
                    }
                  },
                }}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 1 }}
              >
                <FeatureCard {...item} />
              </motion.div>
            );
          })}
        </AnimatePresence>
        <motion.button
          className="arrow-button"
          whileTap={{ scale: 0.8 }}
          onClick={() => handleClick(1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{
            duration: 0.3,
            delay: 0.8,
            type: "spring",
            stiffness: 150,
          }}
          variants={{
            visible: { opacity: 1, x: 0 },
            hidden: { opacity: 0, x: 50 },
          }}
        >
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="group relative inline-flex items-center overflow-hidden rounded-full border-2 border-green-300 px-2 py-2 text-lg font-medium text-green-300 hover:bg-gray-50 hover:text-white md:px-3 md:py-3"
          >
            {/* <ArrowRight className="z-20 h-2 w-2 hover:text-white md:h-6 md:w-6" /> */}
            <span className="duration-400 ease absolute left-0 top-1/2 block h-0 w-full bg-green-300 opacity-100 transition-all group-hover:top-0 group-hover:h-full"></span>
            <span className="ease absolute left-1/2 flex h-10 w-10 -translate-x-1/2 transform items-center justify-start duration-300 group-hover:translate-x-4"></span>
          </motion.div>
        </motion.button>
      </motion.div>
    </div>
  );
}
