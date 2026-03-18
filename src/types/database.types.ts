// This file will contain your Supabase database types
// Generate these types by running: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts

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
      // Add your table types here
    };
    Views: {
      // Add your view types here
    };
    Functions: {
      // Add your function types here
    };
    Enums: {
      // Add your enum types here
    };
  };
}
