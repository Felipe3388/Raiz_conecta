// Escala de texto no estilo da Apple (San Francisco no iPhone, a fonte do sistema nos outros): corpo em 17, nada abaixo
// de 12, e a hierarquia vem do tamanho e do peso (negrito e seminegrito), não de tudo em negrito pesado.
export const typography = {
  // Título grande da tela (Large Title).
  largeTitle: { fontSize: 34, lineHeight: 40, fontWeight: "700", letterSpacing: 0.3 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "700", letterSpacing: 0.2 },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: "700" },
  // Título de bloco (Headline).
  subheading: { fontSize: 17, lineHeight: 22, fontWeight: "600" },
  body: { fontSize: 17, lineHeight: 24, fontWeight: "400" },
  label: { fontSize: 17, lineHeight: 22, fontWeight: "600" },
  hint: { fontSize: 15, lineHeight: 20, fontWeight: "400" },
  input: { fontSize: 17, fontWeight: "400" },
  button: { fontSize: 17, lineHeight: 22, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  // Cabeçalho pequeno acima de um grupo de linhas (Mais, Configurações).
  sectionHeader: { fontSize: 13, lineHeight: 18, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase" },
  // Números grandes (receita, leitura da balança, contagem): largura fixa para não "pular" quando mudam.
  numeric: { fontVariant: ["tabular-nums"] as "tabular-nums"[] },
} as const;
