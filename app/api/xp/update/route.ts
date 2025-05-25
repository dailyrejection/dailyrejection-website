import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Define expanded rank thresholds with more challenging progression
const RANKS = [
  { name: "Novice", threshold: 0 },
  { name: "Apprentice", threshold: 100 },
  { name: "Bronze", threshold: 250 },
  { name: "Bronze Elite", threshold: 500 },
  { name: "Silver", threshold: 800 },
  { name: "Silver Elite", threshold: 1200 },
  { name: "Gold", threshold: 1800 },
  { name: "Gold Elite", threshold: 2500 },
  { name: "Platinum", threshold: 3500 },
  { name: "Diamond", threshold: 5000 },
  { name: "Master", threshold: 7000 },
  { name: "Grand Master", threshold: 10000 },
  { name: "Rejection Legend", threshold: 15000 },
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
    
    console.log(`XP API called: userId=${userId}, action=${action}, challengeId=${challengeId}`);
    
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

    console.log(`Current profile - XP: ${profile.experience_points}, Challenges: ${profile.challenges_completed}`);
    
    // First check if this is a duplicate challenge completion
    if (action === "complete_challenge" && challengeId) {
      // Check if this challenge was already completed by this user by looking at existing submissions
      const { data: existingSubmissions, error: submissionError } = await supabase
        .from("challenge_submissions")
        .select("id, created_at")
        .eq("user_id", userId)
        .eq("challenge_id", challengeId);
      
      if (submissionError) {
        console.error("Error checking existing submissions:", submissionError);
      } else {
        console.log(`Found ${existingSubmissions?.length || 0} existing submissions for this challenge`);
        
        // If there are already submissions for this challenge, don't increment the counter
        if (existingSubmissions && existingSubmissions.length > 0) {
          console.log("This is a duplicate challenge completion - not incrementing challenges_completed");
          
          // Calculate new XP and rank - only award the XP for completion
          const xpToAdd = XP_VALUES.CHALLENGE_COMPLETION;
          const newXP = (profile.experience_points || 0) + xpToAdd;
          const newRank = calculateRank(newXP);
          
          // Update user profile without incrementing challenges_completed
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              experience_points: newXP,
              rank_level: newRank,
              // Do not increment challenges_completed
              updated_at: new Date().toISOString()
            })
            .eq("id", userId);
            
          if (updateError) {
            console.error("Error updating profile after duplicate check:", updateError);
            return NextResponse.json({ error: "Failed to update XP" }, { status: 500 });
          }
          
          return NextResponse.json({
            success: true,
            data: {
              newXP,
              newRank,
              newChallengesCompleted: profile.challenges_completed, // Keep original count
              xpAdded: xpToAdd,
              message: "Challenge was already completed - XP awarded but counter not incremented"
            }
          });
        }
      }
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
    
    console.log(`Updating profile - New XP: ${newXP}, New Challenges: ${newChallengesCompleted}`);
    
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
      // We already checked for existing submissions above, so if we got here,
      // there were no existing submissions for this challenge
      console.log("Recording new challenge completion");
      
      // Record the completion
      const { error: insertError } = await supabase
        .from("challenge_submissions")
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          completed: true,
          created_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error("Error recording challenge completion:", insertError);
      }
    }
    
    console.log(`XP update complete - XP: ${newXP}, Challenges: ${newChallengesCompleted}`);
    
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