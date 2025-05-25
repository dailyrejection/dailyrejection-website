import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.exchangeCodeForSession(code);

    if (session) {
      // Check if the profile is complete
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", session.user.id)
        .single();

      if (!profile?.display_name || !profile?.username) {
        return NextResponse.redirect(`${requestUrl.origin}/profile/complete`);
      }
    }

    return NextResponse.redirect(`${requestUrl.origin}/`);
  }

  return NextResponse.redirect(`${requestUrl.origin}/auth`);
}
