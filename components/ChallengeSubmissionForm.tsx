"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "./ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "sonner";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import {
  MessageCircle,
  Send,
  Loader2,
  Link,
  PenLine,
  Filter,
  Trophy,
  Calendar,
  Video,
  SortAsc,
  SortDesc,
  Clock,
  Trash2,
  Plus,
} from "lucide-react";
import { WeeklyChallenge, ChallengeSubmission } from "@/lib/supabase/types";
import { isValidVideoUrl, getWeekNumber, getWeekRange } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { WeekSelector } from "@/components/admin/WeekSelector";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Function to convert URLs to embed URLs
const getEmbedUrl = (
  url: string
): { embedUrl: string | null; type: "tiktok" | "instagram" | "unknown" } => {
  if (!url) return { embedUrl: null, type: "unknown" };

  // TikTok URL pattern
  const tiktokPattern =
    /https:\/\/(www\.)?(tiktok\.com)\/@([^\/]+)\/video\/(\d+)/i;
  const tiktokMatch = url.match(tiktokPattern);

  if (tiktokMatch) {
    const videoId = tiktokMatch[4];
    return {
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      type: "tiktok",
    };
  }

  // Instagram URL pattern
  const instagramPattern =
    /https:\/\/(www\.)?(instagram\.com)\/(p|reel)\/([^\/]+)/i;
  const instagramMatch = url.match(instagramPattern);

  if (instagramMatch) {
    const postType = instagramMatch[3]; // 'p' for post or 'reel' for reel
    const postId = instagramMatch[4];
    return {
      embedUrl: `https://www.instagram.com/${postType}/${postId}/embed`,
      type: "instagram",
    };
  }

  return { embedUrl: null, type: "unknown" };
};

// Video embed component with loading state
function VideoEmbed({
  url,
  type,
}: {
  url: string;
  type: "tiktok" | "instagram" | "unknown";
}) {
  const [isLoading, setIsLoading] = useState(true);

  // Only render iframe for supported types
  if (type === "unknown") {
    return null;
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 rounded-md">
          <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
        </div>
      )}

      <div
        className="relative w-full overflow-hidden"
        style={{
          paddingBottom: type === "tiktok" ? "177.77%" : "125%",
          minHeight: "250px",
        }}
      >
        <iframe
          src={url}
          className="absolute top-0 left-0 w-full h-full border-0"
          allowFullScreen
          scrolling="no"
          frameBorder="0"
          onLoad={() => setIsLoading(false)}
          allow={type === "tiktok" ? "encrypted-media;" : ""}
        ></iframe>
      </div>
    </div>
  );
}

const submissionSchema = z
  .object({
    social_link: z
      .string()
      .url("Please enter a valid URL")
      .refine((url) => !url || isValidVideoUrl(url), {
        message: "URL must be from TikTok or Instagram",
      })
      .optional()
      .or(z.literal("")),
    comment: z
      .string()
      .min(10, "Comment must have at least 10 characters")
      .max(500, "Comment cannot exceed 500 characters"),
    contact_method: z.enum(["email", "instagram"], {
      required_error: "Please select a contact method",
    }),
    contact_value: z.string().min(1, "Contact information is required"),
  })
  .refine(
    (data) => {
      if (data.contact_method === "email") {
        // Basic email validation
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_value);
      }
      return true;
    },
    {
      message: "Please enter a valid email address",
      path: ["contact_value"], // That means the error is in the contact_value field
    }
  );

const createChallengeSchema = z.object({
  title: z.string().min(5, "Título deve ter pelo menos 5 caracteres").max(100, "Título não pode exceder 100 caracteres"),
  description: z.string().optional(),
  week: z.number(),
  year: z.number()
});

type SubmissionFormData = z.infer<typeof submissionSchema>;
type CreateChallengeFormData = z.infer<typeof createChallengeSchema>;

type SubmissionData = {
  challenge_id: string;
  content: string | null;
  video_url: string | null;
  completed: boolean;
  contact_method: string;
  contact_value: string;
  user_id: string;
};

type ChallengeSubmissionFormProps = {
  initialChallenge?: WeeklyChallenge;
  onSubmit: (data: SubmissionData) => Promise<void>;
};

// Add a type for sorting options
type SortOption = "newest" | "oldest";

export function ChallengeSubmissionForm({
  initialChallenge,
  onSubmit,
}: ChallengeSubmissionFormProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number>(
    getWeekNumber(new Date())
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [tempSelectedWeek, setTempSelectedWeek] =
    useState<number>(selectedWeek);
  const [tempSelectedYear, setTempSelectedYear] =
    useState<number>(selectedYear);
  const [currentChallenge, setCurrentChallenge] =
    useState<WeeklyChallenge | null>(initialChallenge || null);
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [winnerSubmission, setWinnerSubmission] =
    useState<ChallengeSubmission | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<ChallengeSubmission | null>(null);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  } | null>(null);

  // Show create challenge form for admins
  const [isCreateChallengeDialogOpen, setIsCreateChallengeDialogOpen] = useState(false);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      social_link: "",
      comment: "",
      contact_method: "email",
      contact_value: "",
    },
  });

  const createChallengeForm = useForm<CreateChallengeFormData>({
    resolver: zodResolver(createChallengeSchema),
    defaultValues: {
      title: "",
      description: "",
      week: selectedWeek,
      year: selectedYear
    }
  });

  useEffect(() => {
    fetchChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek, selectedYear]);

  useEffect(() => {
    if (currentChallenge) {
      fetchSubmissions(currentChallenge.id);
    } else {
      setSubmissions([]);
      setWinnerSubmission(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChallenge]);

  useEffect(() => {
    // Get current user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUser(session.user);

        // Pre-fill the email field if available
        if (session.user.email) {
          form.setValue("contact_value", session.user.email);
        }
      }
    });
  }, [supabase.auth, form]);

  // Check if user is admin
  useEffect(() => {
    if (user?.id) {
      supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setIsAdmin(data?.is_admin || false);
        });
    }
  }, [user, supabase]);

  // Update form values when selected week/year changes
  useEffect(() => {
    createChallengeForm.setValue("week", selectedWeek);
    createChallengeForm.setValue("year", selectedYear);
  }, [selectedWeek, selectedYear, createChallengeForm]);

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("weekly_challenges")
        .select("*")
        .eq("year", selectedYear);

      if (error) {
        toast.error("Failed to load challenges");
        return;
      }

      setChallenges(data || []);

      // Find current week's challenge
      const weekChallenge =
        data?.find((c) => c.week === selectedWeek && c.year === selectedYear) ||
        null;

      setCurrentChallenge(weekChallenge);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast.error("An error occurred while fetching challenges.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async (challengeId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("challenge_submissions")
        .select(
          `
          *,
          profiles (
            username,
            display_name,
            avatar_seed,
            challenges_completed,
            rank_level
          )
        `
        )
        .eq("challenge_id", challengeId)
        .order("created_at", { ascending: sortOption === "oldest" });

      if (error) {
        console.error("Error fetching submissions:", error);
        return;
      }

      // Check if there's a winner for this challenge
      if (currentChallenge?.winner_submission_id) {
        const winner = data?.find(
          (sub) => sub.id === currentChallenge.winner_submission_id
        );
        if (winner) {
          setWinnerSubmission(winner as ChallengeSubmission);
        }
      }

      setSubmissions(data as ChallengeSubmission[]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setIsLoading(false);
    }
  };

  // Update fetchSubmissions when sortOption changes
  useEffect(() => {
    if (currentChallenge) {
      fetchSubmissions(currentChallenge.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChallenge, sortOption]);

  const handleSubmit = async (data: SubmissionFormData) => {
    if (!currentChallenge) {
      toast.error("No active challenge to submit to");
      return;
    }

    if (!userId) {
      toast.error("You must be logged in to submit a challenge");
      return;
    }

    try {
      setIsSubmitting(true);

      // Check if user already has a submission for this challenge
      const { data: existingSubmissions, error } = await supabase
        .from("challenge_submissions")
        .select("id")
        .eq("user_id", userId)
        .eq("challenge_id", currentChallenge.id);

      if (error) {
        console.error("Error checking existing submissions:", error);
      } else if (existingSubmissions && existingSubmissions.length > 0) {
        // User already has a submission for this challenge
        toast.warning("You already have a submission for this challenge");
      }

      // Proceed with submission regardless
      await onSubmit({
        challenge_id: currentChallenge.id,
        user_id: userId,
        content: data.comment,
        video_url: data.social_link || null,
        contact_method: data.contact_method,
        contact_value: data.contact_value,
        completed: true,
      });

      // Update XP for challenge completion
      // The API now checks for duplicate completions, so this is safe to call
      try {
        const response = await fetch("/api/xp/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            action: "complete_challenge",
            challengeId: currentChallenge.id,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data.message) {
            // If the API detected a duplicate, show a different message
            toast.success(`Participação registrada! ${result.data.xpAdded} XP ganhos!`);
          } else {
            toast.success(`+${result.data.xpAdded} XP ganhos!`);
          }
        }
      } catch (xpError) {
        console.error("Failed to update XP:", xpError);
        // Don't show error to user, the submission was successful
      }

      form.reset();
      setCharCount(0);
      setIsDialogOpen(false);
      toast.success("Your participation has been submitted successfully!");

      // Refresh submissions after submitting
      fetchSubmissions(currentChallenge.id);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An error occurred while sending your submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSubmission = (submission: ChallengeSubmission) => {
    setSelectedSubmission(submission);
    setIsSubmissionDialogOpen(true);
  };

  const applyFilter = () => {
    setSelectedWeek(tempSelectedWeek);
    setSelectedYear(tempSelectedYear);
    setIsFilterDialogOpen(false);
  };

  // Toggle sort order function
  const toggleSortOrder = () => {
    setSortOption(sortOption === "newest" ? "oldest" : "newest");
  };

  // Handle challenge creation
  const handleCreateChallenge = async (data: CreateChallengeFormData) => {
    if (!user?.id) {
      toast.error("Você precisa estar logado para criar um desafio");
      return;
    }

    try {
      setIsCreatingChallenge(true);

      // Check if a challenge already exists for this week
      const existingChallenge = challenges.find(
        (c) => c.week === data.week && c.year === data.year
      );

      if (existingChallenge) {
        toast.error(
          `Um desafio já existe para semana ${data.week}, ${data.year}`
        );
        return;
      }

      // Create the challenge
      const { error } = await supabase
        .from("weekly_challenges")
        .insert({
          title: data.title,
          description: data.description || null,
          week: data.week,
          year: data.year
        });

      if (error) {
        if (error.code === "23505") {
          toast.error(`Um desafio já existe para semana ${data.week}, ${data.year}`);
        } else {
          console.error("Error creating challenge:", error);
          toast.error("Erro ao criar o desafio. Por favor, tente novamente.");
        }
        return;
      }

      toast.success("Desafio criado com sucesso!");
      createChallengeForm.reset();
      setIsCreateChallengeDialogOpen(false);
      fetchChallenges();
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast.error("Ocorreu um erro ao criar o desafio.");
    } finally {
      setIsCreatingChallenge(false);
    }
  };

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <div className="space-y-8 text-center">
        <div className="flex flex-col items-center justify-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent mb-2">
            Weekly Challenge
          </h1>

          {currentChallenge && (
            <div className="mt-4 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-green-800">
                {currentChallenge.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Week {selectedWeek}, {selectedYear} (
                {(() => {
                  const range = getWeekRange(selectedWeek, selectedYear);
                  return `${range.start.toLocaleDateString(
                    "en-US"
                  )} - ${range.end.toLocaleDateString("en-US")}`;
                })()}
                )
              </p>
              <div className="prose prose-green max-w-none mt-4">
                <p>{currentChallenge.description}</p>
              </div>

              {currentChallenge.tiktok_link && (
                <div className="mt-4 pt-4 border-t max-w-md mx-auto">
                  <p className="text-sm font-medium">Reference TikTok:</p>
                  <a
                    href={currentChallenge.tiktok_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 text-sm underline"
                  >
                    {currentChallenge.tiktok_link}
                  </a>
                </div>
              )}

              {winnerSubmission && (
                <div className="mt-6">
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 px-3 py-1 gap-1 cursor-pointer"
                    onClick={() => handleViewSubmission(winnerSubmission)}
                  >
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span>
                      Winner:{" "}
                      {winnerSubmission.profiles?.display_name ||
                        winnerSubmission.profiles?.username ||
                        "Anonymous"}
                    </span>
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4 flex-wrap">
          <Dialog
            open={isFilterDialogOpen}
            onOpenChange={setIsFilterDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="rounded-full px-4 border-green-200 hover:border-green-500 hover:bg-green-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter Challenges
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/95 backdrop-blur-sm sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Select Week</DialogTitle>
                <DialogDescription>
                  Choose a week to view its challenge and submissions
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <WeekSelector
                  selectedWeek={tempSelectedWeek}
                  selectedYear={tempSelectedYear}
                  challenges={challenges}
                  onWeekSelect={setTempSelectedWeek}
                  onYearChange={setTempSelectedYear}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={applyFilter} className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Apply Filter
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {currentChallenge && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full px-4 shadow-md transition-all">
                  <PenLine className="h-4 w-4 mr-2" />
                  Submit Your Participation
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/95 backdrop-blur-sm sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Submit Your Participation</DialogTitle>
                  <DialogDescription>
                    Challenge: {currentChallenge.title}
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="social_link"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Link className="h-4 w-4" />
                            <span>Social Media Link (optional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://www.tiktok.com/@username/video/... or https://www.instagram.com/..."
                              type="url"
                              {...field}
                              value={field.value || ""}
                              className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </FormControl>
                          <FormDescription>
                            Share your TikTok or Instagram post related to this
                            challenge
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            <span>Your Experience</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Share your experience with this challenge..."
                              className="min-h-[120px] border-gray-300 focus:border-green-500 focus:ring-green-500"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setCharCount(e.target.value.length);
                              }}
                              maxLength={500}
                            />
                          </FormControl>
                          <div className="text-xs text-right text-gray-500">
                            {charCount}/500 characters
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact_method"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Preferred contact method</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Reset contact value when changing method
                                form.setValue("contact_value", "");
                              }}
                              defaultValue={field.value}
                              className="flex flex-col space-y-2"
                            >
                              <div className="rounded-md border p-0 shadow-sm hover:border-green-500 transition-colors overflow-hidden">
                                <FormItem className="flex items-center space-x-3 space-y-0 w-full p-0">
                                  <label className="flex items-center space-x-3 p-3 w-full cursor-pointer">
                                    <FormControl>
                                      <RadioGroupItem value="email" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer m-0">
                                      Email
                                    </FormLabel>
                                  </label>
                                </FormItem>
                              </div>
                              <div className="rounded-md border p-0 shadow-sm hover:border-green-500 transition-colors overflow-hidden">
                                <FormItem className="flex items-center space-x-3 space-y-0 w-full p-0">
                                  <label className="flex items-center space-x-3 p-3 w-full cursor-pointer">
                                    <FormControl>
                                      <RadioGroupItem value="instagram" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer m-0">
                                      Instagram DM
                                    </FormLabel>
                                  </label>
                                </FormItem>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormDescription>
                            How we should contact you if your submission is
                            selected
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {form.watch("contact_method") === "email"
                              ? "Your email address"
                              : "Your Instagram username"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                form.watch("contact_method") === "email"
                                  ? "your.email@example.com"
                                  : "@your.instagram.username"
                              }
                              {...field}
                              className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </FormControl>
                          <FormDescription>
                            {form.watch("contact_method") === "email"
                              ? "We'll use this email to contact you if you win"
                              : "We'll send you a DM if you win"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full transition-all"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit participation
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}

          {/* Admin: Create Challenge Button */}
          {isAdmin && !currentChallenge && (
            <Dialog 
              open={isCreateChallengeDialogOpen} 
              onOpenChange={setIsCreateChallengeDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="rounded-full px-4 shadow-md transition-all bg-amber-500 hover:bg-amber-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Desafio
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/95 backdrop-blur-sm sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Criar Novo Desafio</DialogTitle>
                  <DialogDescription>
                    Criar um desafio para a semana {selectedWeek}, {selectedYear}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...createChallengeForm}>
                  <form
                    onSubmit={createChallengeForm.handleSubmit(handleCreateChallenge)}
                    className="space-y-6"
                  >
                    <FormField
                      control={createChallengeForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Título do desafio"
                              {...field}
                              className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createChallengeForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva o desafio em detalhes..."
                              className="min-h-[120px] border-gray-300 focus:border-green-500 focus:ring-green-500"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
                      Este desafio será criado para a semana {selectedWeek}, {selectedYear}
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isCreatingChallenge}
                        className="w-full transition-all"
                      >
                        {isCreatingChallenge ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Desafio
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">Loading challenge information...</p>
          </div>
        ) : !currentChallenge ? (
          <Alert
            variant="destructive"
            className="bg-red-50 border-red-200 max-w-md mx-auto"
          >
            <AlertTitle className="text-xl">Challenge Coming Soon</AlertTitle>
            <AlertDescription className="mx-auto">
              The challenge for week {selectedWeek}, {selectedYear} hasn&apos;t
              been created yet. Check back soon to participate in this
              week&apos;s challenge!
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Separator className="my-8" />

            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Community Submissions</h3>
                
                {submissions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSortOrder}
                    className="flex items-center gap-1"
                  >
                    {sortOption === "newest" ? (
                      <>
                        <SortDesc className="h-4 w-4" />
                        <span>Newest first</span>
                      </>
                    ) : (
                      <>
                        <SortAsc className="h-4 w-4" />
                        <span>Oldest first</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    No submissions yet. Be the first to participate!
                  </p>
                </div>
              ) : (
                <>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="h-10 w-10 text-green-600 animate-spin mb-4" />
                      <p className="text-gray-500">Loading submissions...</p>
                    </div>
                  ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
                      {submissions.map((submission) => (
                        <div key={submission.id} className="break-inside-avoid mb-4 w-full">
                          <Card
                            className={`overflow-hidden hover:shadow-md transition-all cursor-pointer w-full ${
                              submission.id ===
                              currentChallenge.winner_submission_id
                                ? "border-amber-300 bg-amber-50/30"
                                : ""
                            }`}
                            onClick={() => handleViewSubmission(submission)}
                          >
                            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3">
                              <Avatar className="flex-shrink-0">
                                <AvatarFallback className="bg-green-100 text-green-800">
                                  {submission.profiles?.display_name?.[0] ||
                                    submission.profiles?.username?.[0] ||
                                    "U"}
                                </AvatarFallback>
                                {submission.profiles?.avatar_seed && (
                                  <AvatarImage
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${submission.profiles.avatar_seed}`}
                                  />
                                )}
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <CardTitle className="text-sm truncate">
                                    {submission.profiles?.display_name ||
                                      submission.profiles?.username ||
                                      "Anonymous"}
                                  </CardTitle>
                                  {submission.profiles?.challenges_completed &&
                                    submission.profiles.challenges_completed >
                                      0 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs px-1 py-0 h-4 bg-green-100 text-green-800 border-green-200 flex-shrink-0"
                                      >
                                        {submission.profiles.challenges_completed}
                                      </Badge>
                                    )}
                                  {submission.profiles?.rank_level &&
                                    submission.profiles.rank_level !==
                                      "Novice" && (
                                      <Badge
                                        className={`text-xs px-1 py-0 h-4 flex-shrink-0
                                        ${
                                          submission.profiles.rank_level ===
                                          "Bronze"
                                            ? "bg-amber-100 text-amber-800 border-amber-200"
                                            : ""
                                        }
                                        ${
                                          submission.profiles.rank_level ===
                                          "Silver"
                                            ? "bg-slate-200 text-slate-800 border-slate-300"
                                            : ""
                                        }
                                        ${
                                          submission.profiles.rank_level ===
                                          "Gold"
                                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                            : ""
                                        }
                                        ${
                                          submission.profiles.rank_level ===
                                          "Master"
                                            ? "bg-purple-100 text-purple-800 border-purple-200"
                                            : ""
                                        }
                                        ${
                                          submission.profiles.rank_level ===
                                          "Grand Master"
                                            ? "bg-red-100 text-red-800 border-red-200"
                                            : ""
                                        }
                                      `}
                                      >
                                        {submission.profiles.rank_level}
                                      </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <CardDescription className="text-xs flex items-center">
                                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                    {new Date(
                                      submission.created_at
                                    ).toLocaleDateString("en-US")}
                                  </CardDescription>
                                </div>
                              </div>
                              {submission.id ===
                                currentChallenge.winner_submission_id && (
                                <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 flex-shrink-0">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Winner
                                </Badge>
                              )}
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                              <p className="text-sm text-left break-words">
                                {submission.comment}
                              </p>
                              {submission.video_url && (
                                <div className="mt-2 flex items-center text-xs text-green-600">
                                  <Video className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span>Has video</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Submission Detail Dialog */}
      <Dialog
        open={isSubmissionDialogOpen}
        onOpenChange={setIsSubmissionDialogOpen}
      >
        <DialogContent className="bg-white/95 backdrop-blur-sm sm:max-w-[600px]">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-green-100 text-green-800">
                      {selectedSubmission.profiles?.display_name?.[0] ||
                        selectedSubmission.profiles?.username?.[0] ||
                        "U"}
                    </AvatarFallback>
                    {selectedSubmission.profiles?.avatar_seed && (
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedSubmission.profiles.avatar_seed}`}
                      />
                    )}
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle>
                        {selectedSubmission.profiles?.display_name ||
                          selectedSubmission.profiles?.username ||
                          "Anonymous"}
                      </DialogTitle>
                      {selectedSubmission.id ===
                        currentChallenge?.winner_submission_id && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          <Trophy className="h-3 w-3 mr-1" />
                          <span>Winner</span>
                        </Badge>
                      )}
                      {selectedSubmission.profiles?.challenges_completed &&
                        selectedSubmission.profiles.challenges_completed >
                          0 && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-200"
                          >
                            {selectedSubmission.profiles.challenges_completed}
                          </Badge>
                        )}
                      {selectedSubmission.profiles?.rank_level &&
                        selectedSubmission.profiles.rank_level !== "Novice" && (
                          <Badge
                            className={`
                            ${
                              selectedSubmission.profiles.rank_level ===
                              "Bronze"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : ""
                            }
                            ${
                              selectedSubmission.profiles.rank_level ===
                              "Silver"
                                ? "bg-slate-200 text-slate-800 border-slate-300"
                                : ""
                            }
                            ${
                              selectedSubmission.profiles.rank_level === "Gold"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : ""
                            }
                            ${
                              selectedSubmission.profiles.rank_level ===
                              "Master"
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : ""
                            }
                            ${
                              selectedSubmission.profiles.rank_level ===
                              "Grand Master"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : ""
                            }
                          `}
                          >
                            {selectedSubmission.profiles?.rank_level}
                          </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      <DialogDescription>
                        {new Date(
                          selectedSubmission.created_at
                        ).toLocaleDateString("en-US")}
                      </DialogDescription>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="prose prose-green max-w-none">
                  <p>{selectedSubmission.comment}</p>
                </div>

                {selectedSubmission.video_url && (
                  <div className="mt-4 pt-4 border-t">
                    {(() => {
                      const { embedUrl, type } = getEmbedUrl(
                        selectedSubmission.video_url
                      );

                      if (embedUrl) {
                        return (
                          <>
                            <p className="text-sm font-medium mb-2">
                              {type === "tiktok"
                                ? "TikTok Video:"
                                : "Instagram Post:"}
                            </p>

                            <VideoEmbed url={embedUrl} type={type} />
                          </>
                        );
                      }

                      // Fallback to the normal link
                      return (
                        <>
                          <p className="text-sm font-medium mb-2">
                            Social Media Link:
                          </p>
                          <a
                            href={selectedSubmission.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 underline text-sm"
                          >
                            {selectedSubmission.video_url}
                          </a>
                        </>
                      );
                    })()}
                  </div>
                )}
                
                {/* Delete button - only visible for the user who owns the submission */}
                {user && selectedSubmission.user_id === user.id && (
                  <div className="mt-4 pt-4 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete submission</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white/95 backdrop-blur-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-red-600">Confirm Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this submission? This action cannot be undone.
                            <p className="mt-2 text-sm font-medium text-gray-800">
                              This will also remove any XP points and decrease your challenge completion count.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-gray-200">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              try {
                                // Call the API endpoint to delete the submission and update XP
                                const response = await fetch('/api/delete-submission', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    submissionId: selectedSubmission.id,
                                    cleanupMode: 'all'
                                  }),
                                });
                                
                                if (!response.ok) {
                                  const errorData = await response.json();
                                  toast.error(errorData.error || 'Failed to delete submission');
                                  return;
                                }
                                
                                toast.success('Submission deleted successfully');
                                setIsSubmissionDialogOpen(false);
                                
                                // Refresh submissions after deletion
                                if (currentChallenge) {
                                  fetchSubmissions(currentChallenge.id);
                                }
                              } catch (error) {
                                console.error('Error deleting submission:', error);
                                toast.error('An error occurred while deleting the submission');
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
