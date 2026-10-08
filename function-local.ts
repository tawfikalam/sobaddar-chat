import { handleApp } from "../functions/handler.mjs";
import { createFakeSupabase } from "./fake-supabase.mjs";
import { createFakeStorage } from "./fake-storage.mjs";

const supabase = createFakeSupabase();
const storage = createFakeStorage();

Deno.serve({ hostname: "127.0.0.1", port: 8000 }, (request) => {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const nonce = url.searchParams.get("nonce") ?? "";
  if (action === "__fake-upload") return storage.handleUpload(request, nonce);
  if (action === "__fake-media") return storage.handleMedia(nonce);
  return handleApp({ request, supabase, storage });
});
