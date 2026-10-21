import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ==========================================
  // 1. CONFIGURAÇÃO GLOBAL DE CORS PARA A API
  // ==========================================
  if (pathname.startsWith("/api")) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // Libera o acesso para o Expo Web e dispositivos locais
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Responde imediatamente se for a requisição de teste (Preflight) do navegador
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 200, headers: corsHeaders });
    }

    // Para as demais requisições de API, injeta as permissões CORS na resposta
    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // ==========================================
  // 2. REGRAS DE PROTEÇÃO DE PÁGINAS (SUAS REGRAS)
  // ==========================================
  
  // Pega o Cookie que acabamos de configurar no login
  const token = request.cookies.get("token")?.value;

  // Se o usuário tentar acessar painéis e não tiver token, chuta para o login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // O Next.js Edge lê as partes do JWT (que é separado por pontos)
    // A segunda parte do Token contém os dados (payload) em formato Base64
    const payloadBase64 = token.split(".")[1];
    const decodedPayload = Buffer.from(payloadBase64, "base64").toString(
      "utf-8",
    );
    const user = JSON.parse(decodedPayload);

    const role = user.role;

    // AS REGRAS DE OURO DO GUARDA-COSTAS:
    // Tenta entrar no Admin mas não é admin?
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Tenta entrar no Produtor mas não é produtor?
    if (pathname.startsWith("/produtor") && role !== "produtor") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Tenta entrar no Mercado mas não é mercado?
    if (pathname.startsWith("/mercado") && role !== "mercado") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Se a documentação estiver certa, libera a catraca!
    return NextResponse.next();
  } catch (error) {
    // Se o token for falso, malformado ou adulterado, chuta pro login
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// 3. QUAIS ROTAS O GUARDA-COSTAS E O CORS DEVEM MONITORAR?
export const config = {
  matcher: [
    "/api/:path*", // <-- ADICIONADO: monitora todas as rotas de API para aplicar o CORS
    "/admin/:path*",
    "/produtor/:path*",
    "/mercado/:path*",
    "/perfil/:path*",
    "/checkout/:path*",
  ],
};
