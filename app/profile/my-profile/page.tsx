import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
  Trophy, 
  Target, 
  Medal, 
  Star, 
  Info, 
  Calendar, 
  ArrowRight, 
  Video, 
  MessageCircle,
  Award,
  Sparkles,
  Clock,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ChallengeSubmission } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "My Profile | Daily Rejection",
  description: "View your profile, submissions, and ranking",
};

// Define rank thresholds and colors
const RANKS = [
  { 
    name: "Novice", 
    threshold: 0, 
    color: "bg-gray-200", 
    textColor: "text-gray-700",
    description: "Begin your journey",
    perks: ["Challenge completion bonuses"]
  },
  { 
    name: "Bronze", 
    threshold: 100, 
    color: "bg-amber-200", 
    textColor: "text-amber-800",
    description: "Rising challenger",
    perks: ["Bronze badge display"]
  },
  { 
    name: "Silver", 
    threshold: 300, 
    color: "bg-slate-300", 
    textColor: "text-slate-700",
    description: "Experienced rejector",
    perks: ["Increased visibility"]
  },
  { 
    name: "Gold", 
    threshold: 500, 
    color: "bg-yellow-200", 
    textColor: "text-yellow-800",
    description: "Elite performer",
    perks: ["Featured submissions"]
  },
  { 
    name: "Master", 
    threshold: 750, 
    color: "bg-purple-200", 
    textColor: "text-purple-800",
    description: "Mastery achieved",
    perks: ["Special recognition"]
  },
  { 
    name: "Grand Master", 
    threshold: 1000, 
    color: "bg-red-200", 
    textColor: "text-red-800",
    description: "Legendary status",
    perks: ["Hall of Fame entry"]
  },
];

// Helper function to get rank details
function getRankDetails(xp: number) {
  const currentRank = [...RANKS].reverse().find(rank => xp >= rank.threshold);
  const nextRank = RANKS.find(rank => rank.threshold > xp);
  
  const currentRankIndex = RANKS.findIndex(rank => rank.name === currentRank?.name);
  const progress = nextRank 
    ? Math.floor(((xp - currentRank!.threshold) / (nextRank.threshold - currentRank!.threshold)) * 100)
    : 100;
  
  return {
    currentRank,
    nextRank,
    progress,
    xpToNextRank: nextRank ? nextRank.threshold - xp : 0,
    currentRankIndex
  };
}

// Helper function to get rank icon
function getRankIcon(rankName: string) {
  switch (rankName) {
    case "Novice": return <Target className="h-5 w-5" />;
    case "Bronze": return <Medal className="h-5 w-5 text-amber-600" />;
    case "Silver": return <Medal className="h-5 w-5 text-slate-400" />;
    case "Gold": return <Medal className="h-5 w-5 text-yellow-500" />;
    case "Master": return <Trophy className="h-5 w-5 text-purple-600" />;
    case "Grand Master": return <Award className="h-5 w-5 text-red-600" />;
    default: return <Star className="h-5 w-5" />;
  }
}

// Helper function to get rank background and text colors
function getRankColors(rankName: string) {
  switch (rankName) {
    case "Novice": return { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" };
    case "Bronze": return { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" };
    case "Silver": return { bg: "bg-slate-200", text: "text-slate-800", border: "border-slate-300" };
    case "Gold": return { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" };
    case "Master": return { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" };
    case "Grand Master": return { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" };
    default: return { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" };
  }
}

export default async function MyProfilePage() {
  const supabase = await createClient();
  
  // Get user session using getUser for better security
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  
  if (!profile) {
    redirect("/profile/complete");
  }
  
  // Get user submissions
  const { data: submissions = [] } = await supabase
    .from("challenge_submissions")
    .select(`
      *,
      weekly_challenges:challenge_id(
        id,
        title,
        week,
        year,
        winner_submission_id
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false }) as { data: ChallengeSubmission[] };
    
  // Calculate rank details
  const rankDetails = getRankDetails(profile.experience_points || 0);
  
  // Count wins
  const winCount = (submissions || []).filter(sub => 
    sub.weekly_challenges?.winner_submission_id === sub.id
  ).length;
  
  // Get rank colors
  const rankColors = getRankColors(profile.rank_level || "Novice");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-20 pb-16">
      {/* Header */}
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-500 mt-2">
            Track your progress and view your challenge submissions
          </p>
        </div>
      </div>
      
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Profile Card */}
              <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 overflow-hidden relative">
                {/* Add animated background patterns */}
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black,transparent)] opacity-25"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4ade8030,#2dd4bf30,#0ea5e930)] animate-gradient-x"></div>
                
                <div className="h-32 bg-gradient-to-r from-green-600 to-emerald-500 relative overflow-hidden">
                  {/* Add animated particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute w-2 h-2 bg-white/30 rounded-full animate-float-1" style={{ left: '10%', top: '20%' }}></div>
                    <div className="absolute w-2 h-2 bg-white/30 rounded-full animate-float-2" style={{ left: '30%', top: '60%' }}></div>
                    <div className="absolute w-2 h-2 bg-white/30 rounded-full animate-float-3" style={{ left: '70%', top: '40%' }}></div>
                    <div className="absolute w-2 h-2 bg-white/30 rounded-full animate-float-4" style={{ left: '90%', top: '70%' }}></div>
                  </div>
                </div>
                
                <div className="px-6 pb-6 -mt-16 flex flex-col items-center relative">
                  <div className="relative mb-4 group">
                    {/* Add hover effect to avatar */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 blur-xl opacity-70 scale-110 group-hover:scale-125 transition-transform duration-300"></div>
                    <Image
                      src={`https://api.dicebear.com/7.x/personas/svg?seed=${profile.avatar_seed}`}
                      alt={profile.display_name || "Avatar"}
                      width={96}
                      height={96}
                      className="rounded-full border-4 border-white relative z-10 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-1 right-1 z-20 rounded-full p-1.5 bg-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {getRankIcon(profile.rank_level || "Novice")}
                    </div>
                  </div>
                  
                  <h1 className="text-xl font-bold text-gray-800 mt-2">{profile.display_name}</h1>
                  <p className="text-sm text-gray-500">@{profile.username}</p>
                  
                  <Badge 
                    className={`mt-3 ${rankColors.bg} ${rankColors.text} ${rankColors.border}`}
                  >
                    {rankDetails.currentRank?.name}
                  </Badge>
                  
                  <div className="w-full mt-6 space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="flex justify-center mb-1">
                          <Target className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="text-lg font-bold text-green-800">
                          {profile.challenges_completed || 0}
                        </div>
                        <div className="text-xs text-green-600">Challenges</div>
                      </div>
                      
                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <div className="flex justify-center mb-1">
                          <Trophy className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="text-lg font-bold text-amber-800">
                          {winCount}
                        </div>
                        <div className="text-xs text-amber-600">Wins</div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="flex justify-center mb-1">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-lg font-bold text-blue-800">
                          {profile.experience_points || 0}
                        </div>
                        <div className="text-xs text-blue-600">XP</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Next Rank Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-600">Rank Progress</span>
                        </div>
                      </div>
                      
                      {rankDetails.nextRank ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className={rankDetails.currentRank?.textColor || "text-gray-700"}>
                              {rankDetails.currentRank?.name}
                            </span>
                            <span className="text-gray-500">
                              {rankDetails.nextRank.name}
                            </span>
                          </div>
                          
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${rankDetails.currentRank?.color || "bg-gray-200"}`} 
                              style={{ width: `${rankDetails.progress}%` }}
                            ></div>
                          </div>
                          
                          <div className="text-xs text-gray-500 flex items-center justify-between">
                            <span>{profile.experience_points} XP</span>
                            <span>{rankDetails.xpToNextRank} XP to go</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 rounded-lg p-3 text-center">
                          <div className="flex justify-center mb-1">
                            <Award className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="text-sm font-bold text-red-800">
                            Maximum Rank Achieved!
                          </div>
                          <div className="text-xs text-red-600">Grand Master</div>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* XP Tooltip */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                            <Info className="h-4 w-4" />
                            <span>How to earn XP</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-2 p-1">
                            <p className="text-sm font-medium">Ways to earn experience points:</p>
                            <ul className="text-xs space-y-1">
                              <li className="flex items-center gap-1">
                                <Target className="h-3 w-3 text-green-600" />
                                <span>Complete a weekly challenge: <strong>+100 XP</strong></span>
                              </li>
                              <li className="flex items-center gap-1">
                                <Trophy className="h-3 w-3 text-amber-500" />
                                <span>Win a weekly challenge: <strong>+200 XP</strong></span>
                              </li>
                              <li className="flex items-center gap-1">
                                <Award className="h-3 w-3 text-blue-500" />
                                <span>Participate in a challenge: <strong>+10 XP</strong></span>
                              </li>
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Activity Summary */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <CardTitle>Activity Summary</CardTitle>
                    <CardDescription className="mt-1">Your challenge participation overview</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Target className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="text-2xl font-bold text-green-800">{profile.challenges_completed || 0}</span>
                    </div>
                    <h3 className="text-sm font-medium text-green-700">Challenges Completed</h3>
                    <p className="text-xs text-green-600 mt-1">Keep up the good work!</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-amber-100 rounded-full">
                        <Trophy className="h-5 w-5 text-amber-600" />
                      </div>
                      <span className="text-2xl font-bold text-amber-800">{winCount}</span>
                    </div>
                    <h3 className="text-sm font-medium text-amber-700">Challenges Won</h3>
                    <p className="text-xs text-amber-600 mt-1">Your winning streak!</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-2xl font-bold text-blue-800">{profile.experience_points || 0}</span>
                    </div>
                    <h3 className="text-sm font-medium text-blue-700">Total XP</h3>
                    <p className="text-xs text-blue-600 mt-1">
                      {rankDetails.nextRank 
                        ? `${rankDetails.xpToNextRank} XP to ${rankDetails.nextRank.name}` 
                        : "Maximum rank achieved!"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Submissions section */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Submissions</CardTitle>
                    <CardDescription className="mt-1">Your challenge submissions history</CardDescription>
                  </div>
                  <Link href="/weekly-challenges">
                    <Button className="text-white border-0 shadow-md hover:shadow-lg transition-all flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>New Challenge</span>
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {(submissions || []).length > 0 ? (
                  <div className="space-y-4">
                    {(submissions || []).map((submission) => (
                      <div key={submission.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">
                              Week {submission.weekly_challenges?.week}, {submission.weekly_challenges?.year}
                            </span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={submission.weekly_challenges?.winner_submission_id === submission.id 
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200" 
                              : "bg-gray-100 text-gray-600 border-gray-200"}
                          >
                            {submission.weekly_challenges?.winner_submission_id === submission.id ? (
                              <div className="flex items-center gap-1">
                                <Trophy className="h-3 w-3 text-yellow-600" />
                                <span>Winner</span>
                              </div>
                            ) : "Submitted"}
                          </Badge>
                        </div>
                        
                        <h3 className="text-base font-medium text-gray-800 mb-2">
                          {submission.weekly_challenges?.title}
                        </h3>
                        
                        <div className="flex items-start gap-3 mb-3">
                          <MessageCircle className="h-4 w-4 text-gray-400 mt-0.5" />
                          <p className="text-sm text-gray-600">{submission.comment}</p>
                        </div>
                        
                        {submission.video_url && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Video className="h-3 w-3" />
                            <a 
                              href={submission.video_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700 hover:underline flex items-center gap-1"
                            >
                              <span>View submission</span>
                              <ArrowRight className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                        
                        <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Submitted {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                    <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <Target className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No submissions yet</h3>
                    <p className="text-gray-500 mb-6 max-w-xs mx-auto">Complete your first weekly challenge to start earning XP and building your profile</p>
                    <Link href="/weekly-challenges">
                      <Button className="text-white border-0 shadow-md hover:shadow-lg transition-all">
                        Start a Challenge
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
              {(submissions || []).length > 0 && (
                <CardFooter className="flex justify-center pt-0 pb-4">
                  <Link href="/weekly-challenges">
                    <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700">
                      View All Challenges
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 