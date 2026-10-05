import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = ["/login", "/signup"];

// Optimistic check only: it redirects based on the cookie. Pages and actions
// still verify the session through src/lib/dal.ts before reading data.
async function hasSession(token: string | undefined) {
  if (!token || !process.env.SESSION_SECRET) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET), {
      algorithms: ["HS256"],
    });
    return true;
  } catch {
    return false;
  }
}

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic = publicRoutes.includes(path);
  const loggedIn = await hasSession(req.cookies.get("session")?.value);

  if (!isPublic && !loggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (isPublic && loggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico)$).*)"],
};
