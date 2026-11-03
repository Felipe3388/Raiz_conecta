"use client";

import { useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

interface Props {
  spec: Record<string, unknown>;
}

// Swagger UI com um campo para colar o JWT de quem está testando: as rotas protegidas recebem `Authorization: Bearer`.
export default function ReactSwagger({ spec }: Props) {
  const [token, setToken] = useState("");
  const [draft, setDraft] = useState("");

  const apply = () => {
    const value = draft.trim();
    if (value) setToken(value);
  };

  const clear = () => {
    setToken("");
    setDraft("");
  };

  return (
    <div>
      <div className={`mb-6 p-5 rounded-2xl border ${token ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
        {token ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-bold text-green-800 text-sm">Token JWT aplicado</p>
              <p className="text-xs text-green-700 mt-0.5">As rotas protegidas serão chamadas com o seu token.</p>
            </div>
            <button type="button" onClick={clear} className="text-xs text-red-600 hover:text-red-700 font-bold border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 transition-colors">
              Remover token
            </button>
          </div>
        ) : (
          <>
            <p className="font-bold text-amber-800 text-sm mb-1">Documentação pública — rotas protegidas pedem JWT</p>
            <p className="text-xs text-amber-800 mb-3">
              Para testar as rotas de <code className="bg-amber-100 px-1 rounded">/api/admin/*</code> e as de produtor ou mercado, cole o token recebido no login
              (campo <code className="bg-amber-100 px-1 rounded">token</code> da resposta). Cadastro e login funcionam sem token.
            </p>
            <div className="flex gap-2">
              <label htmlFor="jwt" className="sr-only">Token JWT</label>
              <input
                id="jwt"
                type="password"
                autoComplete="off"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && apply()}
                placeholder="Cole aqui o JWT (eyJhbGciOi...)"
                className="flex-1 px-3 py-2 rounded-lg border border-amber-300 text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white font-mono"
              />
              <button type="button" onClick={apply} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-lg transition-colors whitespace-nowrap">
                Aplicar token
              </button>
            </div>
          </>
        )}
      </div>

      <SwaggerUI
        spec={spec}
        requestInterceptor={(request: { headers: Record<string, string> }) => {
          if (token) request.headers["Authorization"] = `Bearer ${token}`;
          return request;
        }}
      />
    </div>
  );
}
