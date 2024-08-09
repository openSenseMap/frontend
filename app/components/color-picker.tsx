import { GithubPicker } from "react-color";

// Accept currentColor and setColor as props
export function ColorPicker({
  currentColor,
  setColor,
}: {
  currentColor: string;
  setColor: (color: string) => void;
}) {
  // Handle color change
  const handleChangeComplete = (color: any) => {
    setColor(color.hex); // Update the color using the setColor function
  };

  return (
    <GithubPicker
      color={currentColor}
      onChangeComplete={handleChangeComplete}
      triangle="hide"
    />
  );
}
