import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WeeklyChallenge } from "@/lib/supabase/types";
import { ChallengeSubmissionForm } from "@/components/ChallengeSubmissionForm";
import { getWeekNumber } from "@/lib/utils";
import { Target, Calendar, Users, Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Weekly Challenges | Daily Rejection",
  description: "Participate in weekly challenges and win prizes!",
};

async function getCurrentChallenge() {
  const supabase = await createClient();
  const currentWeek = getWeekNumber(new Date());
  const currentYear = new Date().getFullYear();

  const { data: challenge } = await supabase
    .from("weekly_challenges")
    .select("*")
    .eq("week", currentWeek)
    .eq("year", currentYear)
    .single();

  return challenge as WeeklyChallenge;
}

export default async function WeeklyChallengesPage() {
  const challenge = await getCurrentChallenge();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container py-12 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200 animate-bounce-slow">
            <Target className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
            Weekly Challenges
          </h1>
          <p className="text-gray-500 mt-3 max-w-2xl">
            Participate in our weekly challenges to build rejection resilience
            and win recognition among our community
          </p>

          <div className="flex items-center gap-6 mt-8">
            {challenge && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4 text-green-600" />
                <span>
                  Week {challenge.week}, {challenge.year}
                </span>
              </div>
            )}
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="h-4 w-4 text-green-600" />
              <span>Community Challenge</span>
            </div>
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Trophy className="h-4 w-4 text-green-600" />
              <span>Win Recognition</span>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 opacity-50 blur-lg transform-gpu"></div>
          <div className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border-0 transition-all duration-300 hover:shadow-2xl hover:shadow-green-200/25">
            <ChallengeSubmissionForm
              initialChallenge={challenge}
              onSubmit={async (data) => {
                "use server";
                const supabase = await createClient();

                // Insert the submission
                await supabase.from("challenge_submissions").insert({
                  challenge_id: data.challenge_id,
                  user_id: data.user_id,
                  comment: data.content,
                  video_url: data.video_url,
                  contact_method: data.contact_method,
                  contact_value: data.contact_value,
                });

                // Note: XP and challenges_completed update is handled entirely by the XP API endpoint
                // and should not be duplicated here to avoid double counting
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
