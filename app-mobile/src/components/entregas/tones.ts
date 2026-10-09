import type { StageTone } from "@/content/deliveryTexts";
import { colors } from "@/theme";

// Cores de cada tom (etapas e resultado da pesagem): a cor forte, o fundo suave e a cor do texto.
export const TONE_COLORS: Record<StageTone, { strong: string; soft: string; border: string; text: string }> = {
  success: { strong: colors.primary, soft: colors.primarySoft, border: colors.primaryBorder, text: colors.primaryText },
  warning: { strong: colors.warning, soft: colors.warningTint, border: colors.warningBorder, text: colors.warningDark },
  danger: { strong: colors.danger, soft: colors.dangerSoft, border: colors.dangerBorder, text: colors.dangerText },
  info: { strong: colors.info, soft: colors.infoSoft, border: colors.infoBorder, text: colors.infoDark },
  neutral: { strong: colors.textSubtle, soft: colors.surfaceMuted, border: colors.borderMid, text: colors.textStrong },
};
