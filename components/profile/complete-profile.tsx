"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { completeProfileSchema } from "@/lib/validations/profile";
import type { z } from "zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

type FormData = z.infer<typeof completeProfileSchema>;

export function CompleteProfile() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    isAvailable?: boolean;
    message?: string;
  }>({});
  const [initialProfile, setInitialProfile] = useState<{
    username?: string;
    display_name?: string;
    avatar_seed?: string;
  } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      display_name: "",
      username: "",
      avatar_seed: Math.random().toString(36).substring(7),
    },
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsInitialLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/auth");
          return;
        }

        // Fetch existing profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, display_name, avatar_seed")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          // If profile is complete, redirect to home
          if (profile.username && profile.display_name) {
            router.push("/");
            return;
          }

          setInitialProfile(profile);
          // Pre-fill form with existing data
          if (profile.username) {
            form.setValue("username", profile.username);
            // Check availability of existing username
            await checkUsernameAvailability(profile.username, true);
          }
          if (profile.display_name) {
            form.setValue("display_name", profile.display_name);
          }
          if (profile.avatar_seed) {
            form.setValue("avatar_seed", profile.avatar_seed);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, form]);

  const checkUsernameAvailability = async (
    username: string,
    isInitial = false
  ) => {
    if (username.length < 3) {
      setUsernameStatus({});
      return false;
    }

    setIsCheckingUsername(true);
    try {
      // First get the session for checking initial username
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      // Using fetch directly to avoid Supabase client logging errors to console
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=id,username&username=eq.${username}`,
        {
          method: 'GET',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // If 406 Not Acceptable or 404 Not Found, username is available
      if (response.status === 406 || response.status === 404) {
        setUsernameStatus({
          isAvailable: true,
          message: "Username is available",
        });
        return true;
      }
      
      // If 200 OK, check if data is empty or belongs to current user
      if (response.ok) {
        const data = await response.json();
        
        // If checking initial username and it belongs to current user, it's available
        if (isInitial && Array.isArray(data) && data.length > 0 && data[0].id === session?.user?.id) {
          setUsernameStatus({
            isAvailable: true,
            message: "This is your current username",
          });
          return true;
        }
        
        if (Array.isArray(data) && data.length === 0) {
          setUsernameStatus({
            isAvailable: true,
            message: "Username is available",
          });
          return true;
        } else {
          setUsernameStatus({
            isAvailable: false,
            message: "Username is already taken",
          });
          return false;
        }
      }
      
      // Default case for other errors
      setUsernameStatus({
        isAvailable: false,
        message: "Error checking username",
      });
      return false;
    } catch {
      // Silent error handling
      setUsernameStatus({
        isAvailable: false,
        message: "Error checking username",
      });
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      // Check username availability one last time, but skip if it's the user's current username
      if (data.username !== initialProfile?.username) {
        const isAvailable = await checkUsernameAvailability(data.username);
        if (!isAvailable) {
          throw new Error("Username is not available");
        }
      }

      const { error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        ...data,
      });

      if (error) throw error;
      toast.success("Profile completed successfully!");
      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewAvatar = () => {
    setIsGeneratingAvatar(true);
    const newSeed = Math.random().toString(36).substring(7);
    form.setValue("avatar_seed", newSeed);
    setTimeout(() => setIsGeneratingAvatar(false), 500);
  };

  if (isInitialLoading) {
    return (
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="space-y-2 text-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-[100px] h-[100px] rounded-full bg-gray-200 animate-pulse" />
            <div className="w-32 h-9 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="h-10 w-full bg-gray-200 rounded animate-pulse mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-200/50">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent">
          Complete Your Profile
        </h1>
        <p className="text-gray-500">
          Let&apos;s configure your profile before starting
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className={`${isGeneratingAvatar ? 'animate-pulse' : ''} rounded-full`}>
                <Image
                  src={`https://api.dicebear.com/7.x/personas/svg?seed=${form.watch(
                    "avatar_seed"
                  )}`}
                  alt="Avatar"
                  width={100}
                  height={100}
                  className="rounded-full bg-gray-50 border-2 border-green-100 shadow-md"
                />
              </div>
              {isGeneratingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 text-green-600 animate-spin" />
                </div>
              )}
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={generateNewAvatar} 
              disabled={isGeneratingAvatar}
              className="flex items-center gap-2 bg-white border-green-200 hover:border-green-300 hover:bg-green-50 transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${isGeneratingAvatar ? 'animate-spin' : ''}`} />
              Generate New Avatar
            </Button>
          </div>

          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your name"
                    disabled={isLoading}
                    className="border-gray-200 focus-visible:ring-green-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      @
                    </span>
                    <Input
                      className="pl-7 border-gray-200 focus-visible:ring-green-500"
                      placeholder="your_username"
                      disabled={isLoading}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (e.target.value.length >= 3) {
                          checkUsernameAvailability(e.target.value);
                        } else {
                          setUsernameStatus({});
                        }
                      }}
                    />
                    {field.value.length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingUsername ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
                        ) : usernameStatus.isAvailable ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : usernameStatus.message ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : null}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
                {field.value.length >= 3 && usernameStatus.message && (
                  <div
                    className={`text-sm mt-1 ${
                      usernameStatus.isAvailable
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {usernameStatus.message}
                  </div>
                )}
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full transition-all shadow-md"
            disabled={
              isLoading || isCheckingUsername || !usernameStatus.isAvailable || !form.formState.isValid
            }
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Complete Profile"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
