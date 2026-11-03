import { LOGO_PATH, LOGO_VIEWBOX } from "./logoPaths";

const ASPECT = LOGO_VIEWBOX.width / LOGO_VIEWBOX.height;

// A logo do Raiz Conecta em uma cor só (a do texto: use classes como text-green-600). Mesmo desenho do app.
export function BrandMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  const { x, y, width, height } = LOGO_VIEWBOX;
  return (
    <svg width={Math.round(size * ASPECT)} height={size} viewBox={`${x} ${y} ${width} ${height}`} aria-hidden="true" className={className}>
      <path d={LOGO_PATH} fill="currentColor" />
    </svg>
  );
}
