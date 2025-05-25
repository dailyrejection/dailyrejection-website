import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { WeeklyChallenge, ChallengeSubmission } from "@/lib/supabase/types";
import { getWeekNumber } from "@/lib/utils";

type SubmissionData = {
  comment: string;
  contact_method: "email" | "instagram";
  social_link?: string;
};

export function useWeeklyChallenges(
  initialWeek?: number,
  initialYear?: number
) {
  const [selectedWeek, setSelectedWeek] = useState<number>(
    initialWeek || getWeekNumber(new Date())
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    initialYear || new Date().getFullYear()
  );
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch all challenges for the selected year
  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from("weekly_challenges")
        .select("*")
        .eq("year", selectedYear);

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      setChallenges([]);
    }
  };

  // Fetch specific challenge
  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("weekly_challenges")
        .select("*")
        .eq("week", selectedWeek)
        .eq("year", selectedYear)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setChallenge(data);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      setChallenge(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch submissions for current challenge
  const fetchSubmissions = async () => {
    if (!challenge?.id) return;

    try {
      const { data, error } = await supabase
        .from("challenge_submissions")
        .select(
          `
          *,
          profiles:user_id (
            username,
            avatar_seed
          )
        `
        )
        .eq("challenge_id", challenge.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setSubmissions([]);
    }
  };

  // Create submission
  const createSubmission = async (data: SubmissionData) => {
    if (!challenge?.id) return;

    const { error } = await supabase.from("challenge_submissions").insert({
      ...data,
      challenge_id: challenge.id,
      is_winner: false,
    });

    if (error) throw error;
    await fetchSubmissions();
  };

  // Update submission
  const updateSubmission = async (
    id: string,
    data: Partial<ChallengeSubmission>
  ) => {
    const { error } = await supabase
      .from("challenge_submissions")
      .update(data)
      .eq("id", id);

    if (error) throw error;
    await fetchSubmissions();
  };

  // Mark winner
  const markAsWinner = async (submissionId: string) => {
    if (!challenge?.id) return;

    // First, remove winner status from all submissions for this challenge
    await supabase
      .from("challenge_submissions")
      .update({ is_winner: false })
      .eq("challenge_id", challenge.id);

    // Then, mark the selected submission as winner
    const { error } = await supabase
      .from("challenge_submissions")
      .update({ is_winner: true })
      .eq("id", submissionId);

    if (error) throw error;
    await fetchSubmissions();
  };

  // Effects to fetch data
  useEffect(() => {
    fetchChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  useEffect(() => {
    fetchChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek, selectedYear]);

  useEffect(() => {
    if (challenge?.id) {
      fetchSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge?.id]);

  return {
    selectedWeek,
    setSelectedWeek,
    selectedYear,
    setSelectedYear,
    challenge,
    challenges,
    submissions,
    loading,
    createSubmission,
    updateSubmission,
    markAsWinner,
    refetchChallenges: fetchChallenges,
    refetchSubmissions: fetchSubmissions,
  };
}
