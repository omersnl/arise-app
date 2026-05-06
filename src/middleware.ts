import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const path = req.nextUrl.pathname

  const protectedPrefixes = ["/dashboard", "/quests", "/shadows", "/weapons", "/skills", "/guild", "/duels"]
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p))

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
