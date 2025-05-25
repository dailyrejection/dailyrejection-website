"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, signUpSchema } from "@/lib/validations/auth";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Mail, User, Check, Lock, Eye, EyeOff, Fingerprint } from "lucide-react";
import { motion } from "framer-motion";

type SignInFormData = z.infer<typeof loginSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

function SignInForm({ onModeChange }: { onModeChange: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();

  const form = useForm<SignInFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignInFormData) {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.display_name || !profile?.username) {
        router.push("/profile/complete");
      } else {
        router.push("/");
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 text-white mx-auto shadow-lg shadow-green-200">
          <Fingerprint className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-4 text-gray-900">Welcome back</h1>
        <p className="text-gray-500">
          Enter your email to sign in to your account
        </p>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Email</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        disabled={isLoading}
                        className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:border-green-500 focus:ring-green-500"
                        {...field}
                      />
                    </FormControl>
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className="pl-10 pr-10 h-12 bg-white border-gray-200 rounded-xl focus:border-green-500 focus:ring-green-500"
                        {...field}
                      />
                    </FormControl>
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full text-white rounded-xl h-12 shadow-md shadow-green-200/50 transition-all duration-300 hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Sign In <ArrowRight className="ml-2 h-5 w-5" />
                </span>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 pt-2 pb-6">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full bg-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-gray-500">or</span>
          </div>
        </div>

        <div className="flex flex-col space-y-3 text-center text-sm">
          <button
            type="button"
            onClick={onModeChange}
            className="text-gray-600 hover:text-green-600 transition-colors font-medium"
          >
            Don&apos;t have an account? <span className="text-green-600 font-semibold">Sign up</span>
          </button>
          <button
            onClick={() => router.push("/auth/reset-password")}
            className="text-gray-600 hover:text-green-600 transition-colors"
          >
            Forgot your password?
          </button>
        </div>
      </CardFooter>
    </>
  );
}

function SignUpForm({ onModeChange }: { onModeChange: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const supabase = createClient();
  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: SignUpFormData) {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      toast.success("Please check your email to confirm your account.");
      onModeChange();
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 text-white mx-auto shadow-lg shadow-green-200">
          <User className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-4 text-gray-900">
          Create your account
        </h1>
        <p className="text-gray-500">
          Join our community and start your rejection journey
        </p>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Email</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        disabled={isLoading}
                        className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:border-green-500 focus:ring-green-500"
                        {...field}
                      />
                    </FormControl>
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className="pl-10 pr-10 h-12 bg-white border-gray-200 rounded-xl focus:border-green-500 focus:ring-green-500"
                        {...field}
                      />
                    </FormControl>
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Confirm Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className="pl-10 pr-10 h-12 bg-white border-gray-200 rounded-xl focus:border-green-500 focus:ring-green-500"
                        {...field}
                      />
                    </FormControl>
                    <Check className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full text-white rounded-xl h-12 shadow-md shadow-green-200/50 transition-all duration-300 hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Create Account <ArrowRight className="ml-2 h-5 w-5" />
                </span>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 pt-2 pb-6">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full bg-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-gray-500">or</span>
          </div>
        </div>

        <div className="text-center text-sm">
          <button
            type="button"
            onClick={onModeChange}
            className="text-gray-600 hover:text-green-600 transition-colors font-medium"
          >
            Already have an account? <span className="text-green-600 font-semibold">Sign in</span>
          </button>
        </div>
      </CardFooter>
    </>
  );
}

export function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const handleModeChange = () => {
    setMode(mode === "signin" ? "signup" : "signin");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full border-0 shadow-2xl bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
        {mode === "signin" ? (
          <SignInForm onModeChange={handleModeChange} />
        ) : (
          <SignUpForm onModeChange={handleModeChange} />
        )}
      </Card>
    </motion.div>
  );
}
