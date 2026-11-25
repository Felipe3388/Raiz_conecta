// Como o módulo deve se comportar. Muda o ritmo de envio sem regravar o firmware; vale para /api/iot/config e para a
// resposta do pareamento.
export function deviceConfig() {
  return {
    // Enviar a cada 500 ms enquanto há peso na balança; a cada 5 s quando vazia (batimento).
    intervaloAtivoMs: 500,
    intervaloOciosoMs: 5000,
    // Quantas leituras juntar no máximo por envio (o servidor aceita até 50).
    lote: 10,
  };
}
