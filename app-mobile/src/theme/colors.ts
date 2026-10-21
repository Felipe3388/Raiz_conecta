// Tokens equivalentes às cores Tailwind usadas nas classes .rc-* do site.
export const colors = {
  background: "#F2F4F2",
  surface: "#FFFFFF",
  surfaceMuted: "#F7F8F7",
  // Fios finos e sutis; só os campos de digitação usam a borda mais forte.
  border: "#ECEEEC",
  borderMid: "#E2E5E2",
  borderStrong: "#CBD0CB",

  text: "#111827",
  textStrong: "#2F3744",
  // Textos de apoio: 6,9:1 e 5,5:1 sobre o fundo (mínimo 4,5:1). O "placeholder" dos campos é mais claro de propósito.
  textMuted: "#4B5563",
  textSubtle: "#5B6472",
  placeholder: "#7A8391",

  // Verde da marca escurecido para o texto branco passar de 4,5:1 (5,0:1 sobre #15803D; o #16A34A antigo dava 3,3:1).
  primary: "#15803D",
  primaryPressed: "#116B31",
  primarySoft: "#F0FDF4",
  primaryTint: "#DCFCE7",
  primaryContrast: "#FFFFFF",

  danger: "#DC2626",
  dangerPressed: "#B91C1C",
  dangerSoft: "#FEF2F2",
  dangerBorder: "#FECACA",
  dangerText: "#991B1B",

  ghostPressed: "#F3F4F6",

  primaryBorder: "#86EFAC",
  primaryText: "#166534",
  info: "#3B82F6",
  infoSoft: "#EFF6FF",
  infoBorder: "#BFDBFE",
  infoText: "#1D4ED8",
  infoDark: "#1E3A8A",

  // Âmbar: catálogo do produtor e avisos (amber-50 a amber-900 do site).
  warning: "#F59E0B",
  warningTint: "#FFFBEB",
  warningSoft: "#FEF3C7",
  warningBorder: "#FDE68A",
  warningBorderStrong: "#FCD34D",
  warningStrong: "#B45309",
  warningText: "#B45309",
  warningDark: "#92400E",
  warningDarkest: "#78350F",

  // Barras de força da senha, da mais fraca para a mais forte.
  strength: ["#EF4444", "#FB923C", "#FACC15", "#22C55E", "#059669"],
} as const;
