import { AlertCircle } from "lucide-react";

export function AuthError({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
      <AlertCircle size={16} className="shrink-0" />
      {message}
    </div>
  );
}
