import Svg, { Path } from "react-native-svg";
import { LOGO_PATH, LOGO_VIEWBOX } from "./logoPaths";

interface BrandMarkProps {
  // Altura do desenho; a largura acompanha a proporção da logo.
  size?: number;
  color: string;
}

const ASPECT = LOGO_VIEWBOX.width / LOGO_VIEWBOX.height;

// A logo do Raiz Conecta (broto com raízes de circuito), em uma cor só. Substitui a folha genérica que vinha da
// biblioteca de ícones; como é vetor, fica nítida em qualquer tamanho e aceita qualquer cor do tema.
export function BrandMark({ size = 24, color }: BrandMarkProps) {
  const { x, y, width, height } = LOGO_VIEWBOX;
  return (
    <Svg width={size * ASPECT} height={size} viewBox={`${x} ${y} ${width} ${height}`} aria-hidden>
      <Path d={LOGO_PATH} fill={color} />
    </Svg>
  );
}
