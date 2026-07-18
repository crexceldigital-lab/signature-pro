import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The mcp_* tables were added by migration 20260718120000 and aren't in the
 * auto-generated Database types yet (they regenerate from the live schema).
 * This untyped view of the admin client is used ONLY for those four tables.
 */
export const mcpDb = supabaseAdmin as unknown as SupabaseClient;
