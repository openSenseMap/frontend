import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from "framer-motion";
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

  useEffect(() => {
    let timeoutId: number | undefined;

    const updateCount = () => {
      if (count.get() !== to) {
        animate(count, to, { duration: 0.15 });
        requestAnimationFrame(updateCount);
      }
    };

    if (inView) {
      timeoutId = window.setTimeout(() => {
        requestAnimationFrame(updateCount);
      }, 450);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [count, inView, to]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export default AnimatedCounter;
