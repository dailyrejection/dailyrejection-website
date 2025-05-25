import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication using getUser for better security
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is admin
    const { data: currentUserProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    
    if (!currentUserProfile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Get request body
    const { submissionId, challengeId } = await request.json();
    
    if (!submissionId || !challengeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Get the submission to find the user
    const { data: submission } = await supabase
      .from("challenge_submissions")
      .select("user_id")
      .eq("id", submissionId)
      .single();
    
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    
    // Update the challenge with the winner submission ID
    const { error: updateChallengeError } = await supabase
      .from("weekly_challenges")
      .update({ winner_submission_id: submissionId })
      .eq("id", challengeId);
    
    if (updateChallengeError) {
      return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 });
    }
    
    // Award XP to the winner
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/xp/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": request.headers.get("cookie") || "", // Pass cookies for auth
        },
        body: JSON.stringify({
          userId: submission.user_id,
          action: "win_challenge",
          challengeId: challengeId,
        }),
      });
      
      if (!response.ok) {
        console.error("Failed to update XP for winner:", await response.text());
      }
    } catch (error) {
      console.error("Error awarding XP:", error);
      // Continue anyway, the winner has been set
    }
    
    return NextResponse.json({
      success: true,
      message: "Winner set successfully and XP awarded"
    });
    
  } catch (error) {
    console.error("Error setting winner:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 