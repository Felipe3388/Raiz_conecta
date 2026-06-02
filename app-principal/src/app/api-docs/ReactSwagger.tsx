'use client';

import React, { useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

type Props = {
  spec: Record<string, any>;
};

function NoStrictMode({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const OriginalStrictMode = React.StrictMode;
(React as any).StrictMode = NoStrictMode;

export default function ReactSwagger({ spec }: Props) {
  const [token, setToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [mostrarBanner, setMostrarBanner] = useState(true);

  const aplicarToken = () => {
    const t = tokenInput.trim();
    if (!t) return;
    setToken(t);
    setMostrarBanner(false);
  };

  const limparToken = () => {
    setToken('');
    setTokenInput('');
    setMostrarBanner(true);
  };

  return (
    <div>
      {/* Banner de autenticação JWT */}
      <div className={`mb-6 p-5 rounded-2xl border ${token ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-start gap-3">
          <div className={`text-2xl ${token ? '✅' : '🔑'}`}>{token ? '✅' : '🔑'}</div>
          <div className="flex-1">
            {token ? (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-green-800 text-sm">Token JWT de Admin aplicado</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Os endpoints protegidos serão autenticados automaticamente com seu token.
                  </p>
                </div>
                <button
                  onClick={limparToken}
                  className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                >
                  Remover Token
                </button>
              </div>
            ) : (
              <>
                <p className="font-bold text-amber-800 text-sm mb-1">
                  Documentação pública — Endpoints de admin requerem JWT
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  Para testar os endpoints administrativos (<code className="bg-amber-100 px-1 rounded">/api/admin/*</code>), 
                  insira abaixo o token JWT obtido pelo login de um usuário <strong>admin</strong>.
                  Endpoints públicos (cadastro, login) funcionam sem token.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && aplicarToken()}
                    placeholder="Cole aqui o JWT do admin... (ex: eyJhbGciOi...)"
                    className="flex-1 px-3 py-2 rounded-lg border border-amber-300 text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white font-mono"
                  />
                  <button
                    onClick={aplicarToken}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-lg transition-colors whitespace-nowrap"
                  >
                    Aplicar Token
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Swagger UI com token injetado se disponível */}
      <SwaggerUI
        spec={spec}
        requestInterceptor={(req) => {
          if (token) {
            req.headers['Authorization'] = `Bearer ${token}`;
          }
          return req;
        }}
      />
    </div>
  );
}

(React as any).StrictMode = OriginalStrictMode;
