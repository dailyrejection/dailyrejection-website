"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { WeeklyChallengeSchema } from "@/lib/validations/weekly-challenges";
import { getWeekNumber, getWeekRange } from "@/lib/utils";
import type {
  ChallengeSubmission,
  WeeklyChallenge,
} from "@/lib/supabase/types";
import {
  Plus,
  Medal,
  Crown,
  Calendar,
  Sparkles,
  Settings,
  Layout,
  Shield,
  Loader2,
} from "lucide-react";
import { WeekSelector } from "@/components/admin/WeekSelector";
import { ChallengesList } from "@/components/admin/ChallengesList";
import { WinnerSelection } from "@/components/admin/WinnerSelection";
import { z } from "zod";
import { motion } from "framer-motion";

export default function AdminPage() {
  const { userDetails, loading: userLoading } = useUser();
  const [selectedWeek, setSelectedWeek] = useState<number>(
    getWeekNumber(new Date())
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchChallenges = async () => {
    const { data, error } = await supabase
      .from("weekly_challenges")
      .select("*")
      .eq("year", selectedYear);

    if (error) {
      toast.error("Failed to load challenges");
      return;
    }

    setChallenges(data || []);
  };

  const fetchSubmissions = async () => {
    // Find the current week's challenge
    const challenge = challenges.find(
      (c) => c.week === selectedWeek && c.year === selectedYear
    );

    if (!challenge) {
      setSubmissions([]);
      return;
    }

    // 1. Fetch submissions (without joins)
    const { data: submissions, error } = await supabase
      .from("challenge_submissions")
      .select("*")
      .eq("challenge_id", challenge.id);

    if (error) {
      toast.error("Failed to load submissions");
      setSubmissions([]);
      return;
    }

    if (!submissions || submissions.length === 0) {
      setSubmissions([]);
      return;
    }

    // 2. Fetch profiles separately
    const userIds = submissions.map((s) => s.user_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, username")
      .in("id", userIds);

    // 3. Join profiles to submissions
    const enriched = submissions.map((sub) => ({
      ...sub,
      profiles: profiles?.find((p) => p.id === sub.user_id),
    }));

    setSubmissions(enriched);
  };

  useEffect(() => {
    fetchChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek, selectedYear]);

  // Separate effect to fetch submissions after challenges are loaded
  useEffect(() => {
    if (challenges.length > 0) {
      fetchSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenges, selectedWeek, selectedYear]);

  // Initial load on component mount
  useEffect(() => {
    fetchChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-white border border-green-100 flex items-center justify-center shadow-lg">
            <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
          </div>
          <p className="text-green-800 font-medium">Loading admin panel...</p>
        </motion.div>
      </div>
    );
  }

  // Redirect if not admin
  if (!userDetails?.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-center text-gray-900">
                Access Denied
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                You don&apos;t have permission to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              <Button
                variant="default"
                onClick={() => (window.location.href = "/")}
                className="text-white font-medium px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const description = formData.get("description") as string;
    const data = {
      title: formData.get("title") as string,
      description:
        description && description.trim() !== "" ? description : undefined,
      week: selectedWeek,
      year: selectedYear,
    };

    try {
      // Check if a challenge already exists for this week
      const existingChallenge = challenges.find(
        (c) => c.week === selectedWeek && c.year === selectedYear
      );

      if (existingChallenge) {
        toast.error(
          `A challenge already exists for week ${selectedWeek}, ${selectedYear}`
        );
        setLoading(false);
        return;
      }

      // Validate form data
      const validatedData = WeeklyChallengeSchema.parse(data);

      // Try to create the challenge
      const { error: supabaseError } = await supabase
        .from("weekly_challenges")
        .insert(validatedData);

      if (supabaseError) {
        // Handle specific Supabase errors
        if (supabaseError.code === "23505") {
          // Unique constraint error
          toast.error(
            `A challenge already exists for week ${selectedWeek}, ${selectedYear}`
          );
        } else {
          toast.error("Failed to create challenge. Please try again.");
        }
        setLoading(false);
        return;
      }

      toast.success("Challenge created successfully");

      setIsDialogOpen(false);
      fetchChallenges();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format and display all validation errors
        const errors = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join("\n");
        toast.error(errors);
      } else {
        toast.error("Failed to create challenge");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWinner = async (
    challengeId: string,
    submissionId: string
  ) => {
    setLoading(true);

    try {
      // Update the challenge with the winner submission ID
      const { error } = await supabase
        .from("weekly_challenges")
        .update({ winner_submission_id: submissionId })
        .eq("id", challengeId);

      if (error) {
        console.error("Error selecting winner:", error);
        toast.error(`Failed to select winner: ${error.message}`);
        return;
      }

      toast.success("Winner selected successfully");
      
      // Refresh challenges and submissions data
      await fetchChallenges();
      const updatedChallenge = challenges.find(c => c.id === challengeId);
      if (updatedChallenge) {
        fetchSubmissions();
      }
    } catch (error) {
      console.error("Error in handleSelectWinner:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (
    id: string,
    data: { title: string; description: string }
  ) => {
    setLoading(true);
    try {
      // Validate the edit data
      const validatedData = WeeklyChallengeSchema.partial().parse(data);

      // Try to update the challenge
      const { error: supabaseError } = await supabase
        .from("weekly_challenges")
        .update(validatedData)
        .eq("id", id);

      if (supabaseError) {
        toast.error("Failed to update challenge. Please try again.");
        return;
      }

      toast.success("Challenge updated successfully");

      fetchChallenges();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format and display all validation errors
        const errors = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join("\n");
        toast.error(errors);
      } else {
        toast.error("Failed to update challenge");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const { error: supabaseError } = await supabase
        .from("weekly_challenges")
        .delete()
        .eq("id", id);

      if (supabaseError) {
        toast.error("Failed to delete challenge. Please try again.");
        return;
      }

      toast.success("Challenge deleted successfully");

      fetchChallenges();
    } catch {
      toast.error("Failed to delete challenge");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="container py-12 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center mb-10"
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Manage weekly challenges and select winners
            </p>
          </div>
        </motion.div>

        <Tabs defaultValue="challenges" className="space-y-10">
          <div className="flex justify-center">
            <TabsList className="bg-white/80 backdrop-blur-md shadow-md border-0 rounded-full p-1 w-[400px]">
              <TabsTrigger
                value="challenges"
                className="flex-1 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-300"
              >
                <Layout className="w-4 h-4 mr-2" />
                <span>Weekly Challenges</span>
              </TabsTrigger>
              <TabsTrigger
                value="winners"
                className="flex-1 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-300"
              >
                <Crown className="w-4 h-4 mr-2" />
                <span>Winner Selection</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="challenges" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="grid gap-8 md:grid-cols-2"
            >
              <Card className="bg-white/90 backdrop-blur-md border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="pb-2 border-b border-gray-100">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-800">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span>Week Selection</span>
                  </CardTitle>
                  <CardDescription className="text-center text-gray-500">
                    Select the week to manage challenges
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <WeekSelector
                    selectedWeek={selectedWeek}
                    selectedYear={selectedYear}
                    challenges={challenges}
                    onWeekSelect={setSelectedWeek}
                    onYearChange={setSelectedYear}
                  />

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className={`w-full mt-6 text-white rounded-xl h-12 shadow-md shadow-green-200/50 transition-all duration-300 hover:shadow-lg ${
                          challenges.some(
                            (c) =>
                              c.week === selectedWeek && c.year === selectedYear
                          )
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={challenges.some(
                          (c) =>
                            c.week === selectedWeek && c.year === selectedYear
                        )}
                      >
                        {challenges.some(
                          (c) =>
                            c.week === selectedWeek && c.year === selectedYear
                        ) ? (
                          <span className="flex items-center">
                            <Layout className="w-5 h-5 mr-2" />
                            Challenge Already Created
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Plus className="w-5 h-5 mr-2" />
                            Create Challenge for Week {selectedWeek}
                          </span>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-800">
                          New Weekly Challenge
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                          Create a new weekly challenge for the week of{" "}
                          {selectedWeek}, {selectedYear}.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                        <div>
                          <label
                            htmlFor="title"
                            className="text-sm font-medium block mb-2 text-gray-700"
                          >
                            Title
                          </label>
                          <Input
                            id="title"
                            name="title"
                            placeholder="Challenge title"
                            required
                            maxLength={100}
                            className="w-full border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                            onChange={(e) => {
                              const count = e.target.value.length;
                              const counter =
                                document.getElementById("title-counter");
                              if (counter) counter.textContent = `${count}/100`;
                            }}
                          />
                          <div
                            className="text-xs text-gray-500 text-right mt-1"
                            id="title-counter"
                          >
                            0/100
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="description"
                            className="text-sm font-medium block mb-2 text-gray-700"
                          >
                            Description (optional)
                          </label>
                          <Textarea
                            id="description"
                            name="description"
                            placeholder="Detailed challenge description"
                            maxLength={400}
                            className="w-full min-h-[100px] border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg resize-none"
                            onChange={(e) => {
                              const count = e.target.value.length;
                              const counter = document.getElementById(
                                "description-counter"
                              );
                              if (counter) counter.textContent = `${count}/400`;
                            }}
                          />
                          <div
                            className="text-xs text-gray-500 text-right mt-1"
                            id="description-counter"
                          >
                            0/400
                          </div>
                        </div>
                        <div className="text-sm text-center py-2 px-4 bg-gray-50 rounded-lg text-gray-600">
                          Week: {selectedWeek}, {selectedYear} (
                          {(() => {
                            const range = getWeekRange(
                              selectedWeek,
                              selectedYear
                            );
                            return `${range.start.toLocaleDateString(
                              "en-US"
                            )} - ${range.end.toLocaleDateString("en-US")}`;
                          })()}
                          )
                        </div>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full text-white rounded-xl h-12 shadow-md shadow-green-200/50 transition-all duration-300 hover:shadow-lg"
                        >
                          {loading ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Creating...
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <Sparkles className="mr-2 h-4 w-4" />
                              Create Challenge
                            </span>
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-md border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="pb-2 border-b border-gray-100">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-800">
                    <Layout className="h-5 w-5 text-green-600" />
                    <span>Active Challenges</span>
                  </CardTitle>
                  <CardDescription className="text-center text-gray-500">
                    View and manage existing challenges
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ChallengesList
                    challenges={challenges}
                    selectedWeek={selectedWeek}
                    selectedYear={selectedYear}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="winners" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="bg-white/90 backdrop-blur-md border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="pb-2 border-b border-gray-100">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-800">
                    <Medal className="h-5 w-5 text-amber-500" />
                    <span>Select Winners</span>
                  </CardTitle>
                  <CardDescription className="text-center text-gray-500">
                    Choose winners for the weekly challenges
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <WinnerSelection
                    challenges={challenges}
                    submissions={submissions}
                    loading={loading}
                    onSelectWinner={handleSelectWinner}
                    selectedWeek={selectedWeek}
                    selectedYear={selectedYear}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
