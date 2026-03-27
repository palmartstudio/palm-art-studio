import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client — for browser use (anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server/admin client — bypasses RLS (service role, server-side only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Type exports ───
export type Collector = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  type?: string;
  status?: string;
  source?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  budget_range?: string;
  interests?: string[];
  tags?: string[];
  last_contact?: string;
  total_spent?: number;
  created_at: string;
  updated_at: string;
};

export type Inquiry = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  type?: string;
  status?: string;
  source?: string;
  artwork_ref?: string;
  collector_id?: string;
  replied_at?: string;
  notes?: string;
  created_at: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  cover_image?: string;
  sanity_image_id?: string;
  status?: string;
  tags?: string[];
  category?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
};

export type BusinessLead = {
  id: string;
  company: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  type?: string;
  status?: string;
  art_budget?: string;
  space_desc?: string;
  notes?: string;
  follow_up_date?: string;
  converted_to_collector_id?: string;
  created_at: string;
  updated_at: string;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  name?: string;
  status?: string;
  source?: string;
  subscribed_at: string;
  tags?: string[];
};

export type Purchase = {
  id: string;
  collector_id?: string;
  artwork_title?: string;
  sanity_artwork_id?: string;
  amount?: number;
  type?: string;
  status?: string;
  notes?: string;
  sale_date?: string;
  shipped_at?: string;
  tracking?: string;
  created_at: string;
};

export type EventRsvp = {
  id: string;
  sanity_event_id?: string;
  event_title?: string;
  name: string;
  email: string;
  phone?: string;
  guests?: number;
  notes?: string;
  attended?: boolean;
  created_at: string;
};
