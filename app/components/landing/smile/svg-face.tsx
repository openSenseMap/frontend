import {
  head,
  smile,
  happy_smile,
  eye_l,
  happy_eye_l,
  eye_r,
  happy_eye_r,
} from "../smile/paths";
import SVGMorph from "./svg-morph";

interface SVGFaceProps {
  isHovered: boolean;
}

export default function SVGFace({ isHovered }: SVGFaceProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg style={{ height: "200px", width: "200px" }} viewBox="0 0 192 192">
        <path d={head} fill="#3D843F" />
        <SVGMorph paths={[smile, happy_smile]} isHovered={isHovered} />
        <SVGMorph paths={[eye_l, happy_eye_l]} isHovered={isHovered} />
        <SVGMorph paths={[eye_r, happy_eye_r]} isHovered={isHovered} />
      </svg>
    </div>
  );
}
