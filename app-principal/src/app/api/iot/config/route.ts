import { NextResponse } from "next/server";
import { requireDevice } from "@/lib/iot/device";

// O módulo pergunta como deve se comportar ao ligar (e de tempos em tempos). Assim o intervalo de envio muda sem
// regravar o firmware. Também devolve a hora do servidor.
export async function GET(req: Request) {
  const auth = await requireDevice(req);
  if (auth.error) return auth.error;

  return NextResponse.json({
    hora: Date.now(),
    vinculada: auth.balanca.emailProdutor !== null,
    // Enviar a cada 500 ms enquanto há peso na balança; a cada 5 s quando vazia (batimento).
    intervaloAtivoMs: 500,
    intervaloOciosoMs: 5000,
    // Quantas leituras juntar no máximo por envio (o servidor aceita até 50).
    lote: 10,
  });
}
