// Altura útil da barra de abas (sem a área segura do aparelho). Ícone + rótulo de 13px não cabem
// nos 49px padrão: o rótulo era espremido e cortado. O botão de ajuda usa o mesmo valor para ficar acima dela.
export const TAB_BAR_CONTENT_HEIGHT = 70;

// O botão redondo Início, no meio da barra, e quanto ele sobe acima dela.
export const HOME_BUTTON_SIZE = 64;
export const HOME_BUTTON_RAISE = 20;
// Largura do vão que o botão ocupa na barra, entre a 2ª e a 3ª aba.
export const HOME_SLOT_WIDTH = HOME_BUTTON_SIZE + 8;

// Quanto o texto ampliado do sistema (iOS "Tamanho do texto", Android "Tamanho da fonte") pode crescer na barra.
// A barra tem altura fixa; passando disso o rótulo cortaria o ícone. O resto do app cresce sem limite.
export const TAB_LABEL_MAX_FONT_SCALE = 1.3;

// Em tela larga (tablet, navegador) as abas ficam juntas no centro da barra, em vez de espalhadas pela largura toda.
export const TAB_BAR_MAX_WIDTH = 640;
