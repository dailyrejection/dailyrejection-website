import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Define rank thresholds
const RANKS = [
  { name: "Novice", threshold: 0 },
  { name: "Bronze", threshold: 100 },
  { name: "Silver", threshold: 300 },
  { name: "Gold", threshold: 500 },
  { name: "Master", threshold: 750 },
  { name: "Grand Master", threshold: 1000 },
];

// XP values
const XP_VALUES = {
  CHALLENGE_COMPLETION: 100,
  CHALLENGE_WIN: 200,
  CHALLENGE_PARTICIPATION: 10
};

// Helper function to determine rank based on XP
function calculateRank(xp: number): string {
  let rank = "Novice";
  
  for (const rankLevel of RANKS) {
    if (xp >= rankLevel.threshold) {
      rank = rankLevel.name;
    } else {
      break;
    }
  }
  
  return rank;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication using getUser for better security
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get request body
    const { userId, action, challengeId } = await request.json();
    
    // Verify admin for certain actions or user can only update their own XP
    if (userId !== user.id) {
      // Check if the current user is an admin
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      
      if (!currentUserProfile?.is_admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    // Get current user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("experience_points, challenges_completed")
      .eq("id", userId)
      .single();
    
    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    let xpToAdd = 0;
    let challengesToAdd = 0;
    
    // Determine XP to add based on action
    switch (action) {
      case "complete_challenge":
        xpToAdd = XP_VALUES.CHALLENGE_COMPLETION;
        challengesToAdd = 1;
        break;
      case "win_challenge":
        xpToAdd = XP_VALUES.CHALLENGE_WIN;
        // No need to increment challenges_completed as it was already incremented on completion
        break;
      case "participate":
        xpToAdd = XP_VALUES.CHALLENGE_PARTICIPATION;
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    
    // Calculate new XP and rank
    const newXP = (profile.experience_points || 0) + xpToAdd;
    const newRank = calculateRank(newXP);
    const newChallengesCompleted = (profile.challenges_completed || 0) + challengesToAdd;
    
    // Update user profile
    const { error } = await supabase
      .from("profiles")
      .update({
        experience_points: newXP,
        rank_level: newRank,
        challenges_completed: newChallengesCompleted,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select();
    
    if (error) {
      console.error("Error updating XP:", error);
      return NextResponse.json({ error: "Failed to update XP" }, { status: 500 });
    }
    
    // If this is a challenge completion, record it
    if (action === "complete_challenge" && challengeId) {
      // Check if this challenge was already completed by this user
      const { data: existingSubmission } = await supabase
        .from("challenge_submissions")
        .select("id")
        .eq("user_id", userId)
        .eq("challenge_id", challengeId)
        .single();
      
      if (!existingSubmission) {
        // Record the completion
        await supabase
          .from("challenge_submissions")
          .insert({
            user_id: userId,
            challenge_id: challengeId,
            completed: true,
            created_at: new Date().toISOString()
          });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        newXP,
        newRank,
        newChallengesCompleted,
        xpAdded: xpToAdd
      }
    });
    
  } catch (error) {
    console.error("XP update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 