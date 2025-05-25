"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

import { DeleteAccount } from "@/components/profile/delete-account";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserCircle, AtSign, Camera, Shield, RefreshCw, Check, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export function EditProfile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [originalUsername, setOriginalUsername] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<{
    isAvailable?: boolean;
    message?: string;
  }>({});
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        setOriginalUsername(data.username);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameStatus({});
      return false;
    }

    // If username is the same as original, it's available
    if (username === originalUsername) {
      setUsernameStatus({
        isAvailable: true,
        message: "This is your current username",
      });
      return true;
    }

    setIsCheckingUsername(true);
    try {
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
      
      // If 200 OK, check if data is empty
      if (response.ok) {
        const data = await response.json();
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

  const generateNewAvatar = async () => {
    if (!profile) return;

    setIsGeneratingAvatar(true);
    try {
      const newSeed = Math.random().toString(36).substring(7);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_seed: newSeed })
        .eq("id", profile.id);

      if (error) throw error;
      setProfile((prev) => (prev ? { ...prev, avatar_seed: newSeed } : null));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred while generating the avatar");
      }
    } finally {
      setTimeout(() => {
        setIsGeneratingAvatar(false);
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setError("");

    try {
      // First, check username availability if it's different from original
      if (profile.username !== originalUsername) {
        const isAvailable = await checkUsernameAvailability(profile.username || "");
        if (!isAvailable) {
          throw new Error("Username is not available");
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          username: profile.username,
        })
        .eq("id", profile.id);

      if (error) throw error;
      setOriginalUsername(profile.username);
      toast.success("Profile updated successfully");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error("Failed to update profile");
      } else {
        setError("An unexpected error occurred");
        toast.error("An error occurred while updating the profile");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="w-full max-w-3xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent">Settings</h1>
        <p className="text-gray-500">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border border-gray-200/75 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Camera className="h-5 w-5" />
              Avatar
            </CardTitle>
            <CardDescription>
              Your avatar is generated using DiceBear Personas
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative">
              <div className={`${isGeneratingAvatar ? 'animate-pulse' : ''} rounded-full`}>
                <Image
                  src={`https://api.dicebear.com/7.x/personas/svg?seed=${profile.avatar_seed}`}
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
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="border border-gray-200/75 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <UserCircle className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={profile.display_name || ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, display_name: e.target.value } : null
                    )
                  }
                  placeholder="Your name"
                  required
                  minLength={2}
                  className="border-gray-200 focus-visible:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label>Username</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <AtSign className="h-4 w-4" />
                  </span>
                  <Input
                    className="pl-9 border-gray-200 focus-visible:ring-green-500"
                    value={profile.username || ""}
                    onChange={(e) => {
                      const newUsername = e.target.value.toLowerCase();
                      setProfile((prev) =>
                        prev ? { ...prev, username: newUsername } : null
                      );
                      if (newUsername.length >= 3) {
                        checkUsernameAvailability(newUsername);
                      } else {
                        setUsernameStatus({});
                      }
                    }}
                    placeholder="your_username"
                    required
                    minLength={3}
                    pattern="^[a-z0-9_]+$"
                    title="Username can only contain lowercase letters, numbers and underscore"
                  />
                  {profile.username && profile.username.length >= 3 && (
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
                {profile.username && profile.username.length >= 3 && usernameStatus.message && (
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
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              {showSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Profile updated successfully!
                </div>
              )}

              <div className="flex justify-end gap-4 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSaving}
                  className="border-gray-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving || (profile.username !== originalUsername && !usernameStatus.isAvailable)}
                  className="transition-all shadow-md"
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        <Card className="border border-red-100/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccount />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
