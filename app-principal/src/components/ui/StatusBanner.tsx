import { Clock, XCircle } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";

interface StatusBannerProps {
  status: "EM_ANALISE" | "REJEITADO" | string;
  onLogout: () => void;
}

export function StatusBanner({ status, onLogout }: StatusBannerProps) {
  const isRejeitado = status === "REJEITADO";
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className={`p-12 text-center shadow-lg max-w-lg border-t-4 ${isRejeitado ? "border-red-500" : "border-amber-500"}`}>
        {isRejeitado ? (
          <>
            <XCircle size={64} className="mx-auto text-red-500 mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Cadastro Recusado</h2>
            <p className="text-gray-600 mb-6">
              Entre em contato com a administração para revisar seus documentos.
            </p>
          </>
        ) : (
          <>
            <Clock size={64} className="mx-auto text-amber-500 mb-6 animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Conta em Análise</h2>
            <p className="text-gray-600 mb-6">
              Sua documentação está com os administradores. Aguarde a liberação.
            </p>
          </>
        )}
        <Button onClick={onLogout} variant="outline" className="w-full">Sair</Button>
      </Card>
    </div>
  );
}
