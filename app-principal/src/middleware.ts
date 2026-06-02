import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 1. Pega o Cookie que acabamos de configurar no login
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Se o usuário tentar acessar painéis e não tiver token, chuta para o login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // 2. O Next.js Edge lê as partes do JWT (que é separado por pontos)
    // A segunda parte do Token contém os dados (payload) em formato Base64
    const payloadBase64 = token.split(".")[1];
    const decodedPayload = Buffer.from(payloadBase64, "base64").toString(
      "utf-8",
    );
    const user = JSON.parse(decodedPayload);

    const role = user.role;

    // 3. AS REGRAS DE OURO DO GUARDA-COSTAS:
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

// 4. QUAIS ROTAS O GUARDA-COSTAS DEVE PROTEGER?
export const config = {
  matcher: [
    "/admin/:path*",
    "/produtor/:path*",
    "/mercado/:path*",
    "/perfil/:path*",
    "/checkout/:path*",
  ],
};
