"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newPasswordSchema } from "@/lib/validations/auth";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { ArrowRight, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";

type FormData = z.infer<typeof newPasswordSchema>;

export function NewPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const form = useForm<FormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      toast.success("Password updated successfully");
    } catch {
      toast.error("Failed to update password");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border border-gray-200/50 shadow-lg">
      <CardHeader className="space-y-2 text-center">
        {isSuccess ? (
          <>
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 text-white mx-auto shadow-lg">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent">
              Password Updated
            </h1>
            <p className="text-gray-600">
              Your password has been updated successfully. You can now log in with the new password.
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 text-white mx-auto shadow-lg">
              <KeyRound className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent">
              New Password
            </h1>
            <p className="text-gray-600">
              Enter your new password below
            </p>
          </>
        )}
      </CardHeader>

      {!isSuccess ? (
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          disabled={isLoading}
                          className="pr-10 border-gray-200 focus-visible:ring-green-500"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          disabled={isLoading}
                          className="pr-10 border-gray-200 focus-visible:ring-green-500"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full transition-all shadow-md"
                disabled={isLoading || !form.formState.isValid}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Update Password <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      ) : (
        <CardFooter className="flex justify-center">
          <Button 
            className="mt-4 transition-all shadow-md"
            onClick={() => router.push("/auth")}
          >
            Back to login
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
