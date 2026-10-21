export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

// Cantos mais arredondados, como nos cartões e folhas do iOS.
export const radius = { sm: 8, md: 14, lg: 20, xl: 28, full: 999 } as const;

// Sombras bem leves no lugar de bordas grossas: o cartão se destaca do fundo sem pesar.
export const elevation = {
  card: "0px 1px 2px rgba(16, 24, 16, 0.06), 0px 6px 18px rgba(16, 24, 16, 0.05)",
  raised: "0px 2px 4px rgba(16, 24, 16, 0.10), 0px 10px 28px rgba(16, 24, 16, 0.12)",
} as const;

// Altura mínima de qualquer coisa tocável (44 pt na Apple).
export const TOUCH_TARGET = 44;
