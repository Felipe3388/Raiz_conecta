import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  message?: string;
  color?: "green" | "blue" | "amber";
}

const colors = {
  green: "text-green-700",
  blue:  "text-blue-700",
  amber: "text-amber-700",
};

export function PageLoader({ message = "Carregando...", color = "green" }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className={`animate-spin ${colors[color]}`} size={40} />
      <p className={`font-bold text-base ${colors[color]}`}>{message}</p>
    </div>
  );
}
