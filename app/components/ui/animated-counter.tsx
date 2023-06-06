import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

type AnimatedCounterProps = {
  from: number;
  to: number;
};

function AnimatedCounter({ from, to }: AnimatedCounterProps) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  const ref = useRef(null);
  const inView = useInView(ref);

  // while in view, animate the count
  useEffect(() => {
    if (inView) {
      const updateCount = () => {
        if (count.get() !== to) {
          animate(count, to, { duration: 1 });
          requestAnimationFrame(updateCount);
        }
      };

      requestAnimationFrame(updateCount);
    }
  }, [count, inView, to]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export default AnimatedCounter;
