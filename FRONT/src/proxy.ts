import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/_next", "/favicon"];

/**
 * Proxy (Next.js 16) — verifica presença do cookie JWT da nova API.
 * A validação real é feita em cada página via getServerSession().
 * Esta camada apenas redireciona usuários sem token para o login.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const hasSession = !!request.cookies.get("hub_token")?.value;

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
