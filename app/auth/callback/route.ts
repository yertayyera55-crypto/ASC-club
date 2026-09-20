import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const destination = process.env.NODE_ENV === "development" || !forwardedHost
    ? origin
    : `https://${forwardedHost}`;

  if (code) {
    const response = NextResponse.redirect(`${destination}/?signed_in=1`);
    response.headers.set("Cache-Control", "no-store");

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headers) {
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            if (headers) Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  return NextResponse.redirect(`${destination}/?auth_error=1`);
}
