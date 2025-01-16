import  { type Key, useState, useEffect  } from "react";

export default function useKeyboardNav(
  initCursorVal: number = 0,
  cursorMin: number = 0,
  cursorMax: number = 0
) {
  const useKeyPress = function (targetKey: Key) {
    const [keyPressed, setKeyPressed] = useState(false);

    useEffect(() => {
      const downHandler = ({ key }: { key: string }) => {
        if (key === targetKey) {
          setKeyPressed(true);
        }
      };

      const upHandler = ({ key }: { key: string }) => {
        if (key === targetKey) {
          setKeyPressed(false);
        }
      };

      window.addEventListener("keydown", downHandler);
      window.addEventListener("keyup", upHandler);

      return () => {
        window.removeEventListener("keydown", downHandler);
        window.removeEventListener("keyup", upHandler);
      };
    }, [targetKey]);

    return keyPressed;
  };

  const downPress = useKeyPress("ArrowDown");
  const upPress = useKeyPress("ArrowUp");
  const enterPress = useKeyPress("Enter");
  const controlPress = useKeyPress("Control");
  const metaPress = useKeyPress("Meta");
  const [cursor, setCursor] = useState(initCursorVal);

  useEffect(() => {
    if (downPress && cursor < cursorMax - 1) {
      setCursor(cursor + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downPress, cursorMax]);
  useEffect(() => {
    if (upPress && cursor > 0) {
      setCursor(cursor - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upPress, cursorMin]);

  return {
    cursor,
    setCursor,
    enterPress,
    controlPress,
    metaPress,
  };
}
