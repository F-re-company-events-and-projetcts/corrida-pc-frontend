import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002")
  );
  res.cookies.set("admin_token", "", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
