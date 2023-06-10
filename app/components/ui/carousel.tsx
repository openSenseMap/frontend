import {
  AnimatePresence,
  motion,
} from "framer-motion";
import { useState } from "react";
import { Variants } from "framer-motion";
import { Feature } from "~/lib/directus";

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
  console.log("🚀 ~ file: carousel.tsx:61 ~ App ~ data:", data);
  const [[activeIndex, direction], setActiveIndex] = useState<[number, number]>(
    [0, 0]
  );
  const items: string[] = ["🍔", "🍕", "🌭", "🍗"];

  const indexInArrayScope =
    ((activeIndex % items.length) + items.length) % items.length;

  const visibleItems: string[] = [...items, ...items].slice(
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
      {visibleItems.map((item) => {
        return (
          <motion.div
            className="card flex h-full w-full items-center justify-center rounded-lg bg-white text-4xl shadow-md"
            key={item}
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
            <div
              key={data[0].id}
              className="dark:border-green-200 dark:bg-gray-100/[rgba(217,217,217,0.1)] flex flex-col items-center justify-center rounded-lg border-4 border-solid border-green-100 p-4 text-center text-gray-300 dark:text-gray-100"
            >
              <div className="dark:text-green-200 pb-4 font-serif text-2xl font-extrabold text-green-100 subpixel-antialiased">
                {data[0].title}
              </div>
              <div className="text-center text-lg">
                {data[0].description}
              </div>
              <div className="pt-4">
                <img
                  src={`${ENV.DIRECTUS_URL}/assets/${data[0].icon}`}
                  alt="api_svg"
                />
              </div>
            </div>
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
