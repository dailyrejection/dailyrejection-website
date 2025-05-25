import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  try {
    const supabase = await createClient();

    // First check if there's a valid user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      // Clear any invalid session
      await supabase.auth.signOut();

      // If trying to access protected routes, redirect to auth
      if (
        request.nextUrl.pathname.startsWith("/admin") ||
        request.nextUrl.pathname.startsWith("/profile") ||
        request.nextUrl.pathname.startsWith("/weekly-challenges")
      ) {
        const redirectUrl = new URL("/auth", request.url);
        redirectUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      return NextResponse.next();
    }

    // Redirect to home if trying to access /auth while logged in
    if (request.nextUrl.pathname === "/auth") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // For admin routes, verify if user is admin
    if (request.nextUrl.pathname.startsWith("/admin")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // For protected routes, verify if profile exists
    if (
      request.nextUrl.pathname.startsWith("/profile") ||
      request.nextUrl.pathname.startsWith("/weekly-challenges")
    ) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.display_name || !profile?.username) {
        // Only redirect to complete profile if the user exists but profile is incomplete
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("id", user.id);

        if (count === 0) {
          // Profile doesn't exist at all, sign out and redirect to auth
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL("/auth", request.url));
        }

        // Profile exists but is incomplete
        if (!request.nextUrl.pathname.startsWith("/profile/complete")) {
          return NextResponse.redirect(
            new URL("/profile/complete", request.url)
          );
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, clear session and redirect to auth
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/auth", request.url));
  }
}

export const config = {
  matcher: ["/auth", "/admin/:path*", "/profile/:path*", "/weekly-challenges/:path*"],
};
