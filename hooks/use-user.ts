import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profileError) throw profileError;
          setUserDetails(profile);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null);
        setUserDetails(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            setUserDetails(data);
          });
      } else {
        setUser(null);
        setUserDetails(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, userDetails, loading };
}
