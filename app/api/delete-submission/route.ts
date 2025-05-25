import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// XP values
const XP_VALUES = {
  CHALLENGE_COMPLETION: 100,
  CHALLENGE_PARTICIPATION: 10,
};

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

// Define a schema for request validation
const deleteSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
  cleanupMode: z.enum(['single', 'all']).default('single'),
});

export async function POST(request: Request) {
  try {
    // Support both form data and JSON
    let submissionId: string;
    let cleanupMode: 'single' | 'all' = 'single';

    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON request
      const body = await request.json();
      const validatedData = deleteSubmissionSchema.parse(body);
      submissionId = validatedData.submissionId;
      cleanupMode = validatedData.cleanupMode;
    } else {
      // Handle form data request
      const formData = await request.formData();
      submissionId = formData.get("submissionId") as string;
      cleanupMode = (formData.get("cleanupMode") as 'single' | 'all') || 'single';
    }

    console.log(`Deleting submission ${submissionId} with cleanup mode: ${cleanupMode}`);

    if (!submissionId) {
      return NextResponse.json(
        { error: "Submission ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get the user to verify ownership
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the submission to check if it's a winner
    const { data: submission, error: submissionError } = await supabase
      .from("challenge_submissions")
      .select("*, weekly_challenges:challenge_id(winner_submission_id)")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      console.error("Error fetching submission:", submissionError);
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Check if user owns the submission or is an admin
    if (submission.user_id !== user.id) {
      // Check if user is admin
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!userProfile?.is_admin) {
        return NextResponse.json(
          { error: "Not authorized to delete this submission" },
          { status: 403 }
        );
      }
    }

    // Get user profile of the submission owner to update XP and challenge count
    const { data: profile } = await supabase
      .from("profiles")
      .select("experience_points, challenges_completed")
      .eq("id", submission.user_id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    console.log(`Current profile state - XP: ${profile.experience_points}, Challenges: ${profile.challenges_completed}`);

    // Check if this is the user's only submission for this challenge
    const { data: userSubmissions, error: submissionsError } = await supabase
      .from("challenge_submissions")
      .select("id")
      .eq("user_id", submission.user_id)
      .eq("challenge_id", submission.challenge_id);

    if (submissionsError) {
      console.error("Error checking user submissions:", submissionsError);
    }

    // Count how many submissions for this challenge (including the one being deleted)
    const submissionCount = userSubmissions?.length || 0;
    console.log(`User has ${submissionCount} submissions for this challenge`);

    // If we're in 'all' cleanup mode or there's only one submission,
    // delete all submissions for this challenge to ensure clean state
    if (cleanupMode === 'all' || submissionCount <= 1) {
      console.log(`Deleting all ${submissionCount} submissions for this challenge`);
      
      const { error: bulkDeleteError } = await supabase
        .from("challenge_submissions")
        .delete()
        .eq("user_id", submission.user_id)
        .eq("challenge_id", submission.challenge_id);
      
      if (bulkDeleteError) {
        console.error("Error bulk deleting submissions:", bulkDeleteError);
        // Fall back to single delete if bulk delete fails
        const { error: singleDeleteError } = await supabase
          .from("challenge_submissions")
          .delete()
          .eq("id", submissionId);
        
        if (singleDeleteError) {
          console.error("Error deleting submission:", singleDeleteError);
          return NextResponse.json(
            { error: "Failed to delete submission" },
            { status: 500 }
          );
        }
      }
    } else {
      // Just delete the specific submission
      console.log(`Deleting single submission ${submissionId}`);
      const { error: deleteError } = await supabase
        .from("challenge_submissions")
        .delete()
        .eq("id", submissionId);

      if (deleteError) {
        console.error("Error deleting submission:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete submission" },
          { status: 500 }
        );
      }
    }

    // Only decrement challenges_completed if this is the user's only submission 
    // for this challenge, or we're deleting all submissions
    const shouldDecrementCounter = submissionCount <= 1 || cleanupMode === 'all';
    console.log(`Should decrement counter: ${shouldDecrementCounter}`);

    // Calculate XP to remove
    const xpToRemove = XP_VALUES.CHALLENGE_COMPLETION;
    
    // Calculate new XP and challenges count
    const newXP = Math.max(0, (profile.experience_points || 0) - xpToRemove);
    
    // Only decrement challenges_completed if we should
    const newChallengesCount = shouldDecrementCounter
      ? Math.max(0, (profile.challenges_completed || 0) - 1)
      : profile.challenges_completed;
      
    const newRank = calculateRank(newXP);

    console.log(`Updating profile - New XP: ${newXP}, New Challenges: ${newChallengesCount}`);

    // Update user profile with new XP and challenges count
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        experience_points: newXP,
        challenges_completed: newChallengesCount,
        rank_level: newRank,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submission.user_id);

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      // Continue despite error, the submission was deleted successfully
    }

    // If this was a JSON request, return JSON response
    const acceptHeader = request.headers.get("accept");
    if (acceptHeader && acceptHeader.includes("application/json")) {
      return NextResponse.json({
        success: true,
        message: "Submission deleted successfully",
        data: {
          newXP,
          newChallengesCount,
          newRank,
          xpRemoved: xpToRemove,
          submissionsDeleted: cleanupMode === 'all' ? submissionCount : 1
        }
      });
    }

    // Otherwise return basic success response
    return NextResponse.json({
      success: true,
      message: "Submission deleted successfully"
    });
  } catch (error) {
    console.error("Error in delete-submission route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 