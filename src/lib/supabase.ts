import { createClient } from "@supabase/supabase-js";

// Usa la service_role key SOLO en el servidor (src/pages/api/**).
// Nunca la expongas al cliente ni la pongas como variable PUBLIC_.
export const supabaseAdmin = createClient(
  import.meta.env.SUPABASE_URL!,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
