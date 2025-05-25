import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify that the user is deleting their own account
    const { userId } = await request.json();
    if (userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete the user's auth account using admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      session.user.id
    );
    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return new NextResponse("Error deleting user", { status: 500 });
    }

    return new NextResponse("Account deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error in delete-account route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
