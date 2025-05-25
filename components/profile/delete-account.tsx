"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deleteAccountSchema } from "@/lib/validations/profile";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Trash2 } from "lucide-react";

export function DeleteAccount() {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const supabase = createClient();

  const form = useForm<z.input<typeof deleteAccountSchema>>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      confirmation: "",
    },
  });

  async function onSubmit() {
    try {
      setIsLoading(true);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not found");

      // Delete user account through serverless function
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      // Clear all Supabase data
      await supabase.auth.signOut();

      // Clear any stored data
      localStorage.clear();
      sessionStorage.clear();

      // Show success message
      toast.success("Account deleted successfully");

      // Force a complete page reload to clear all states
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setIsOpen(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm" 
          className="bg-red-600 hover:bg-red-700 gap-2 text-white"
        >
          <Trash2 className="h-4 w-4" />
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-red-100 shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-red-50 p-4 rounded-lg mb-4 text-sm text-red-700 border border-red-100">
          <p className="font-medium mb-2">Attention: Deleting your account:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You will lose all your activity history</li>
            <li>You will not be able to recover your account in the future</li>
            <li>Your username will be available to others</li>
          </ul>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(() => setShowConfirmDialog(true))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="confirmation"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="delete my account"
                      disabled={isLoading}
                      className="font-mono border-red-200 focus-visible:ring-red-500"
                    />
                  </FormControl>
                  <FormDescription className="text-gray-500">
                    Write &quot;delete my account&quot; to confirm
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="border-gray-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isLoading || !form.formState.isValid}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete Account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action cannot be undone."
        onConfirm={onSubmit}
        confirmText="Yes, delete my account"
        cancelText="No, cancel"
      />
    </Dialog>
  );
}
