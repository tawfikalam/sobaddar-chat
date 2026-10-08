import { createClient } from "npm:@supabase/supabase-js@2.57.4";
// The platform injects this module at deployment; never create functions/_qoder locally.
import { storage } from "./_qoder/storage.mjs";
import { serveSite } from "./adapter.mjs";
import { handleApp } from "./handler.mjs";

Deno.serve(
  serveSite(
    ({ request, supabase }: { request: Request; supabase: unknown }) => handleApp({ request, supabase, storage }),
    { createClient, env: (name: string) => Deno.env.get(name) }
  )
);
