import Svg, { Path } from "react-native-svg";

// A mesma folha (ícone "Leaf") usada na logo do site.
export const LEAF_PATHS = [
  "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z",
  "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12",
];

interface LeafIconProps {
  size?: number;
  color: string;
  strokeWidth?: number;
}

export function LeafIcon({ size = 24, color, strokeWidth = 2 }: LeafIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {LEAF_PATHS.map((d) => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
