/* eslint-disable @typescript-eslint/no-explicit-any */
import swaggerSpec from '@/swagger.json';
import ReactSwagger from './ReactSwagger';

// A página de api-docs é PÚBLICA — qualquer pessoa pode visualizar a documentação.
// Para endpoints admin, o usuário deve inserir manualmente o JWT de administrador.
export default function ApiDocsPage() {
  return (
    <section className="bg-white min-h-screen">
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🌿</span>
            <h1 className="text-2xl font-black text-white">Raiz Conecta — API Docs</h1>
          </div>
          <p className="text-green-200 text-sm">
            Documentação pública da API. Endpoints administrativos requerem token JWT de admin.
          </p>
        </div>
      </div>
      <div className="p-8 max-w-5xl mx-auto">
        <ReactSwagger spec={swaggerSpec as Record<string, any>} />
      </div>
    </section>
  );
}
