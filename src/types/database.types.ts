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
      clients: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          invested_amount: number;
          commission_percentage: number;
          total_profit: number;
          total_withdrawals: number;
          commission_due: number;
          commission_received: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          invested_amount?: number;
          commission_percentage?: number;
          total_profit?: number;
          total_withdrawals?: number;
          commission_due?: number;
          commission_received?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          invested_amount?: number;
          commission_percentage?: number;
          total_profit?: number;
          total_withdrawals?: number;
          commission_due?: number;
          commission_received?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_pnl: {
        Row: {
          id: string;
          client_id: string;
          date: string;
          pnl_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          date: string;
          pnl_amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          date?: string;
          pnl_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      withdrawals: {
        Row: {
          id: string;
          client_id: string;
          amount: number;
          withdrawal_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          amount: number;
          withdrawal_date: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          amount?: number;
          withdrawal_date?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      commission_payments: {
        Row: {
          id: string;
          client_id: string;
          amount: number;
          payment_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          amount: number;
          payment_date: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          amount?: number;
          payment_date?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      weekly_reports: {
        Row: {
          client_id: string;
          client_name: string;
          week_start: string;
          week_end: string;
          weekly_pnl: number;
          trading_days: number;
        };
      };
    };
    Functions: {};
    Enums: {};
  };
}

// Helper types
export type Client = Database['public']['Tables']['clients']['Row'];
export type DailyPnl = Database['public']['Tables']['daily_pnl']['Row'];
export type Withdrawal = Database['public']['Tables']['withdrawals']['Row'];
export type CommissionPayment = Database['public']['Tables']['commission_payments']['Row'];
export type WeeklyReport = Database['public']['Views']['weekly_reports']['Row'];
