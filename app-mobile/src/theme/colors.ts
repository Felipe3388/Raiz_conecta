// Tokens equivalentes às cores Tailwind usadas nas classes .rc-* do site.
export const colors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceMuted: "#F9FAFB",
  border: "#F3F4F6",
  borderMid: "#E5E7EB",
  borderStrong: "#D1D5DB",

  text: "#111827",
  textStrong: "#374151",
  textMuted: "#6B7280",
  textSubtle: "#9CA3AF",

  primary: "#16A34A",
  primaryPressed: "#15803D",
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
  warningStrong: "#D97706",
  warningText: "#B45309",
  warningDark: "#92400E",
  warningDarkest: "#78350F",

  // Barras de força da senha, da mais fraca para a mais forte.
  strength: ["#EF4444", "#FB923C", "#FACC15", "#22C55E", "#059669"],
} as const;
