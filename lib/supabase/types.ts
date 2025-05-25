export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type WeeklyChallenge = Database["public"]["Tables"]["weekly_challenges"]["Row"];

export interface ChallengeSubmission {
  id: string;
  created_at: string;
  challenge_id: string;
  user_id: string;
  comment: string;
  social_link?: string;
  contact_method: "email" | "instagram";
  contact_value: string;
  is_winner: boolean;
  video_url?: string;
  profiles?: {
    username: string;
    display_name?: string;
    avatar_seed?: string;
    challenges_completed?: number;
    rank_level?: string;
  };
  weekly_challenges?: {
    id: string;
    title: string;
    week: number;
    year: number;
    winner_submission_id: string | null;
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          username: string | null;
          avatar_seed: string | null;
          created_at: string;
          updated_at: string;
          is_admin: boolean;
          challenges_completed: number;
          experience_points: number;
          rank_level: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          username?: string | null;
          avatar_seed?: string | null;
          created_at?: string;
          updated_at?: string;
          is_admin?: boolean;
          challenges_completed?: number;
          experience_points?: number;
          rank_level?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          username?: string | null;
          avatar_seed?: string | null;
          created_at?: string;
          updated_at?: string;
          is_admin?: boolean;
          challenges_completed?: number;
          experience_points?: number;
          rank_level?: string;
        };
      };
      weekly_challenges: {
        Row: {
          id: string;
          week: number;
          year: number;
          title: string;
          description: string;
          created_at: string;
          updated_at: string;
          winner_submission_id: string | null;
          tiktok_link: string | null;
        };
        Insert: {
          id?: string;
          week: number;
          year: number;
          title: string;
          description: string;
          created_at?: string;
          updated_at?: string;
          winner_submission_id?: string | null;
          tiktok_link?: string | null;
        };
        Update: {
          id?: string;
          week?: number;
          year?: number;
          title?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
          winner_submission_id?: string | null;
          tiktok_link?: string | null;
        };
      };
      challenge_submissions: {
        Row: {
          id: string;
          challenge_id: string;
          content: string | null;
          video_url: string | null;
          completed: boolean;
          contact_method: string;
          contact_value: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          content?: string | null;
          video_url?: string | null;
          completed?: boolean;
          contact_method: string;
          contact_value: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          content?: string | null;
          video_url?: string | null;
          completed?: boolean;
          contact_method?: string;
          contact_value?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: {
          id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
