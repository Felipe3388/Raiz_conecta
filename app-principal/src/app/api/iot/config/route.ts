import { NextResponse } from "next/server";
import { requireDevice } from "@/lib/iot/device";
import { deviceConfig } from "@/lib/iot/config";

// O módulo pergunta como deve se comportar ao ligar (e de tempos em tempos). Assim o intervalo de envio muda sem
// regravar o firmware. Também devolve a hora do servidor.
export async function GET(req: Request) {
  const auth = await requireDevice(req);
  if (auth.error) return auth.error;

  return NextResponse.json({
    hora: Date.now(),
    vinculada: auth.balanca.emailProdutor !== null,
    ...deviceConfig(),
  });
}
