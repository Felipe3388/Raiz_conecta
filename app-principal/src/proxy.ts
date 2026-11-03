import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, type Role } from "@/lib/auth/jwt";
import { corsHeaders } from "@/lib/http/cors";

// Cada área do site só abre para o perfil dela.
const AREAS: { prefix: string; role: Role }[] = [
  { prefix: "/admin", role: "admin" },
  { prefix: "/produtor", role: "produtor" },
  { prefix: "/mercado", role: "mercado" },
  { prefix: "/catalogo", role: "mercado" },
  { prefix: "/checkout", role: "mercado" },
];

// Next 16: o antigo "middleware" agora se chama "proxy" (mesmo papel: roda antes de cada página e rota da API).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    const cors = corsHeaders(process.env.CORS_ALLOWED_ORIGIN);
    if (request.method === "OPTIONS") return new NextResponse(null, { status: 204, headers: cors });
    const response = NextResponse.next();
    Object.entries(cors).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }

  // Páginas protegidas: sem token válido (assinatura conferida, não só lida) volta para o login.
  const token = request.cookies.get("token")?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) return NextResponse.redirect(new URL("/login", request.url));

  const area = AREAS.find((item) => pathname.startsWith(item.prefix));
  if (area && session.role !== area.role) return NextResponse.redirect(new URL("/login", request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/produtor/:path*", "/mercado/:path*", "/catalogo/:path*", "/perfil/:path*", "/checkout/:path*"],
};
