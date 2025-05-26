import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Define a schema for request validation
const checkSubmissionsSchema = z.object({
  userId: z.string().uuid(),
});

// Maximum number of submissions allowed per day
const MAX_DAILY_SUBMISSIONS = 3;

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userId } = checkSubmissionsSchema.parse(body);
    
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the user ID in the request is the authenticated user or if the user is an admin
    if (user.id !== userId) {
      // Check if user is admin
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      
      if (!userProfile?.is_admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    // Get today's date at 00:00:00 (start of day) in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    // Get tomorrow's date at 00:00:00 (start of tomorrow) in UTC
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    
    // Format dates for Postgres
    const todayStr = today.toISOString();
    const tomorrowStr = tomorrow.toISOString();
    
    // Count submissions made today by this user
    const { data, error, count } = await supabase
      .from("challenge_submissions")
      .select("id", { count: 'exact' })
      .eq("user_id", userId)
      .gte("created_at", todayStr)
      .lt("created_at", tomorrowStr);
    
    if (error) {
      console.error("Error checking submissions:", error);
      return NextResponse.json(
        { error: "Failed to check submission limits" },
        { status: 500 }
      );
    }
    
    // Calculate submissions remaining and when submissions reset
    const submissionsToday = count || 0;
    const submissionsRemaining = Math.max(0, MAX_DAILY_SUBMISSIONS - submissionsToday);
    const canSubmit = submissionsRemaining > 0;
    
    // Calculate time until reset (next day at midnight UTC)
    const now = new Date();
    const resetTime = tomorrow.getTime() - now.getTime(); // milliseconds until reset
    const resetHours = Math.floor(resetTime / (1000 * 60 * 60));
    const resetMinutes = Math.floor((resetTime % (1000 * 60 * 60)) / (1000 * 60));
    
    return NextResponse.json({
      success: true,
      data: {
        submissionsToday,
        submissionsRemaining,
        maxDailySubmissions: MAX_DAILY_SUBMISSIONS,
        canSubmit,
        resetTime: {
          date: tomorrow.toISOString(),
          hours: resetHours,
          minutes: resetMinutes,
        }
      }
    });
    
  } catch (error) {
    console.error("Error in check-daily-submissions route:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 