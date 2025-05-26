"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import { Settings, LogOut, ChevronDown, Target, ShieldCheck, User as UserIcon, Clock } from "lucide-react";
import { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

// Type for daily submissions info
type DailySubmissionsInfo = {
  submissionsToday: number;
  submissionsRemaining: number;
  maxDailySubmissions: number;
  canSubmit: boolean;
  resetTime: {
    hours: number;
    minutes: number;
  };
}

function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, loading };
}

function useProfile(user: User | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }

    loadProfile();

    // Subscribe to profile changes
    const channel = supabase
      .channel(`public:profiles:id=eq.${user?.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user?.id}`,
        },
        (payload) => {
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { profile, loading };
}

export function Navbar() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user);
  const isLoading = authLoading || profileLoading;
  const supabase = createClient();
  const [dailySubmissions, setDailySubmissions] = useState<DailySubmissionsInfo | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Fetch daily submission limits when user is loaded
  useEffect(() => {
    const fetchDailySubmissionLimits = async () => {
      if (!user) return;
      
      try {
        setLoadingSubmissions(true);
        const response = await fetch("/api/check-daily-submissions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          setDailySubmissions(result.data);
        }
      } catch (error) {
        console.error("Error fetching daily submission limits:", error);
      } finally {
        setLoadingSubmissions(false);
      }
    };
    
    fetchDailySubmissionLimits();
    
    // Set up interval to refresh the reset time
    const interval = setInterval(() => {
      fetchDailySubmissionLimits();
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-700 to-emerald-600 border-b border-green-800/20 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-white">
                <Image
                  src="/images/logo.png"
                  alt="Daily Rejection"
                  width={120}
                  height={32}
                  priority
                  className="object-contain w-auto h-14"
                />
              </span>
            </Link>
            <div className="ml-8 hidden md:flex items-center space-x-6">
              <Link
                href="/weekly-challenges"
                className="relative group text-white hover:text-white/90 transition-colors py-1 flex items-center space-x-1"
              >
                <Target className="h-4 w-4" />
                <span className="relative z-10">Weekly Challenges</span>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white/70 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-2 p-2">
                <div className="w-9 h-9 rounded-full bg-white/20 animate-pulse" />
                <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
              </div>
            ) : user && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-all duration-200">
                    <div className="relative">
                      <Image
                        src={`https://api.dicebear.com/7.x/personas/svg?seed=${profile.avatar_seed}`}
                        alt={profile.display_name || "Avatar"}
                        width={36}
                        height={36}
                        className="rounded-full ring-2 ring-white/40 shadow-sm"
                      />
                      {profile.challenges_completed > 0 && (
                        <div className="absolute -top-1 -right-1 flex items-center justify-center">
                          <Badge variant="outline" className="h-5 px-1 bg-yellow-500 border-yellow-600 text-white text-xs font-semibold">
                            {profile.challenges_completed}
                          </Badge>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-300 rounded-full border-2 border-green-700 shadow-sm"></div>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {profile.display_name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-white/70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl rounded-xl"
                >
                  <DropdownMenuLabel className="text-xs font-semibold text-gray-500">
                    My Account
                  </DropdownMenuLabel>
                  
                  <div className="px-2 py-1.5 mb-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Challenges Completed</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        {profile.challenges_completed || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Rank</span>
                      <Badge 
                        className={`
                          ${profile.rank_level === 'Novice' ? 'bg-gray-100 text-gray-800 border-gray-200' : ''}
                          ${profile.rank_level === 'Bronze' ? 'bg-amber-100 text-amber-800 border-amber-200' : ''}
                          ${profile.rank_level === 'Silver' ? 'bg-slate-200 text-slate-800 border-slate-300' : ''}
                          ${profile.rank_level === 'Gold' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                          ${profile.rank_level === 'Master' ? 'bg-purple-100 text-purple-800 border-purple-200' : ''}
                          ${profile.rank_level === 'Grand Master' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                        `}
                      >
                        {profile.rank_level || 'Novice'}
                      </Badge>
                    </div>
                    
                    {/* Daily Submission Limits */}
                    {dailySubmissions && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Daily Submissions</span>
                          <Badge 
                            className={cn(
                              "text-xs",
                              dailySubmissions.submissionsRemaining > 0 
                                ? "bg-green-100 text-green-800 border-green-200" 
                                : "bg-amber-100 text-amber-800 border-amber-200"
                            )}
                          >
                            {dailySubmissions.submissionsToday} / {dailySubmissions.maxDailySubmissions}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-gray-400" />
                            Reset in
                          </span>
                          <span className="text-xs font-medium text-gray-700">
                            {dailySubmissions.resetTime.hours}h {dailySubmissions.resetTime.minutes}m
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {loadingSubmissions && !dailySubmissions && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Daily Submissions</span>
                          <div className="h-4 w-12 bg-gray-100 animate-pulse rounded"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem
                    onClick={() => router.push("/profile/my-profile")}
                    className="cursor-pointer hover:bg-gray-50 rounded-md"
                  >
                    <UserIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={() => router.push("/profile/edit")}
                    className="cursor-pointer hover:bg-gray-50 rounded-md"
                  >
                    <Settings className="mr-2 h-4 w-4 text-gray-500" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  
                  {profile.is_admin && (
                    <DropdownMenuItem
                      onClick={() => router.push("/admin")}
                      className="cursor-pointer hover:bg-gray-50 rounded-md"
                    >
                      <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                onClick={() => router.push("/auth")}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white shadow-sm transition-all duration-200"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
