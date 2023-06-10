import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Variants } from "framer-motion";
import { Feature } from "~/lib/directus";
import FeatureCard from "../landing/features-card";

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

export default function App({ data }: FeaturesProps) {
  const [[activeIndex, direction], setActiveIndex] = useState<[number, number]>(
    [0, 0]
  );

  const indexInArrayScope =
    ((activeIndex % data.length) + data.length) % data.length;

  const visibleItems: Feature[] = [...data, ...data].slice(
    indexInArrayScope,
    indexInArrayScope + 3
  );

  const handleClick = (newDirection: number): void => {
    setActiveIndex((prevIndex) => [prevIndex[0] + newDirection, newDirection]);
  };

  return (
    <div className="main-wrapper flex w-full flex-col items-center">
      <div className="wrapper m-20 flex">
        <motion.button
          className="arrow-button"
          whileTap={{ scale: 0.8 }}
          onClick={() => handleClick(-1)}
        >
          ◀︎
        </motion.button>
        <AnimatePresence mode="popLayout">
          {visibleItems.map((item: Feature) => {
            return (
              <motion.div
                className="card flex h-full w-full items-center justify-center rounded-lg bg-white text-4xl shadow-md"
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
        >
          ▶︎
        </motion.button>
      </div>
    </div>
  );
}
