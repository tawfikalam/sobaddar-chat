// Public chat room backend. Every visitor may read and post; edit/delete
// additionally require the device token hash recorded on the message row.
// The browser never receives database credentials or storage object paths.
import { verifyUploadedObject } from "./storage-validation.mjs";

const json = (body, status = 200, headers = {}) =>
  Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });
const methodNotAllowed = (allow) => json({ error: "method_not_allowed" }, 405, { allow });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;
const EMOJI = /^[\p{Extended_Pictographic}\p{Emoji_Modifier}\u200d\uFE0F\u20E3\u{E0020}-\u{E007F}]{1,12}$/u;
const EMOJI_PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
const CONTROL = /[\p{Cc}\p{Cf}\p{Cs}]/u;

const COLUMNS =
  "id,sender_name,sender_avatar,kind,body,media_path,reply_to_id,reply_to_name,reply_to_gist,edited_at,created_at";

const POLL_WINDOW = 100;
const HISTORY_PAGE = 50;
const MAX_JSON_BYTES = 32 * 1024;
const MAX_TEXT = 2000;
const MAX_CAPTION = 300;
const MAX_NAME = 24;
const MAX_SIGN_IDS = 24;
const SIGNED_URL_TTL = 7200;

const MEDIA_KINDS = {
  image: {
    maxBytes: 10 * 1024 * 1024,
    contentTypeExt: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/avif": "avif",
    },
  },
  video: {
    maxBytes: 10 * 1024 * 1024,
    contentTypeExt: { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" },
  },
  audio: {
    maxBytes: 10 * 1024 * 1024,
    contentTypeExt: { "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a" },
  },
};
const MEDIA_PATH =
  /^chat\/\d{6}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|gif|webp|avif|mp4|webm|mov|ogg|m4a)$/;

const MEDIA_GIST = { image: "[ছবি]", video: "[ভিডিও]", audio: "[ভয়েস মেসেজ]" };

const codePoints = (text) => [...text].length;

const clip = (text, max) => (codePoints(text) <= max ? text : [...text].slice(0, max).join(""));

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readJson(request) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_JSON_BYTES) return null;
  let text;
  try {
    text = await request.text();
  } catch {
    return null;
  }
  if (text.length > MAX_JSON_BYTES) return null;
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return null;
  }
  return body && typeof body === "object" && !Array.isArray(body) ? body : null;
}

function parseIdentity(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name || codePoints(name) > MAX_NAME || CONTROL.test(name)) return null;
  const avatar = raw.avatar;
  if (typeof avatar !== "string" || !EMOJI.test(avatar) || !EMOJI_PICTOGRAPHIC.test(avatar)) return null;
  const token = raw.token;
  if (typeof token !== "string" || !UUID.test(token)) return null;
  return { name, avatar, token };
}

function readText(value, max) {
  if (typeof value !== "string") return null;
  const text = value.replace(/\r\n/g, "\n").trim();
  if (!text || codePoints(text) > max) return null;
  return text;
}

function readCaption(value) {
  if (value == null || value === "") return { caption: null };
  const text = readText(value, MAX_CAPTION);
  if (!text) return { error: true };
  return { caption: text };
}

async function resolveReply(supabase, rawId) {
  if (rawId == null || rawId === "") return {};
  if (typeof rawId !== "string" || !UUID.test(rawId)) return { invalid: true };
  const { data, error } = await supabase.from("messages").select("id,sender_name,kind,body").eq("id", rawId).maybeSingle();
  if (error) throw new Error("database_request_failed");
  if (!data) return {}; // replied message was deleted meanwhile; send without the reply
  const gist = data.kind === "text" ? clip(data.body ?? "", 90) : MEDIA_GIST[data.kind] ?? "";
  return { id: data.id, name: data.sender_name, gist };
}

const toItem = (row) => ({
  id: row.id,
  name: row.sender_name,
  avatar: row.sender_avatar,
  kind: row.kind,
  body: row.body,
  hasMedia: Boolean(row.media_path),
  reply: row.reply_to_id ? { id: row.reply_to_id, name: row.reply_to_name, gist: row.reply_to_gist } : null,
  editedAt: row.edited_at,
  createdAt: row.created_at,
});

async function listMessages(request, supabase) {
  if (request.method !== "GET") return methodNotAllowed("GET");
  const params = new URL(request.url).searchParams;
  const beforeCreated = params.get("before_created");
  const beforeId = params.get("before_id");
  const hasBefore = beforeCreated != null || beforeId != null;
  if (hasBefore && (!TIMESTAMP.test(beforeCreated ?? "") || !UUID.test(beforeId ?? ""))) {
    return json({ error: "invalid_cursor" }, 400);
  }
  let query = supabase.from("messages").select(`${COLUMNS},sender_token_hash`);
  query = hasBefore
    ? query.or(`created_at.lt.${beforeCreated},and(created_at.eq.${beforeCreated},id.lt.${beforeId})`).limit(HISTORY_PAGE)
    : query.limit(POLL_WINDOW);
  const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false });
  if (error || !Array.isArray(data)) return json({ error: "database_request_failed" }, 503);
  // Callers may prove ownership with their device token so the UI can mark
  // their own messages. Only a boolean is returned; stored hashes never leave.
  const rawToken = request.headers.get("x-device-token");
  const tokenHash = typeof rawToken === "string" && UUID.test(rawToken) ? await sha256Hex(rawToken) : null;
  const items = data.slice().reverse().map((row) => ({
    ...toItem(row),
    mine: tokenHash != null && row.sender_token_hash === tokenHash,
  }));
  return json({ items });
}

async function sendMessage(request, supabase) {
  if (request.method !== "POST") return methodNotAllowed("POST");
  const body = await readJson(request);
  const identity = parseIdentity(body);
  if (!body || !identity) return json({ error: "invalid_payload" }, 400);
  const text = readText(body.text, MAX_TEXT);
  if (!text) return json({ error: "invalid_text" }, 400);

  let reply;
  try {
    reply = await resolveReply(supabase, body.replyToId);
  } catch {
    return json({ error: "database_request_failed" }, 503);
  }
  if (reply.invalid) return json({ error: "invalid_reply" }, 400);

  const row = {
    id: crypto.randomUUID(),
    sender_name: identity.name,
    sender_avatar: identity.avatar,
    sender_token_hash: await sha256Hex(identity.token),
    kind: "text",
    body: text,
    media_path: null,
    reply_to_id: reply.id ?? null,
    reply_to_name: reply.name ?? null,
    reply_to_gist: reply.gist ?? null,
    edited_at: null,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("messages").insert(row).select(COLUMNS).single();
  if (error || !data) return json({ error: "database_request_failed" }, 503);
  return json({ item: toItem(data) });
}

async function createUploadIntent(request, storage) {
  if (request.method !== "POST") return methodNotAllowed("POST");
  const body = await readJson(request);
  const identity = parseIdentity(body);
  const spec = MEDIA_KINDS[body?.kind];
  if (!body || !identity || !spec) return json({ error: "invalid_payload" }, 400);
  const contentType = typeof body.contentType === "string" ? body.contentType.toLowerCase().split(";")[0].trim() : "";
  const extension = spec.contentTypeExt[contentType];
  if (!extension) return json({ error: "invalid_media_type" }, 400);
  const size = body.size;
  if (!Number.isSafeInteger(size) || size < 1 || size > spec.maxBytes) {
    return json({ error: "invalid_media_size" }, 400);
  }
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const objectPath = `chat/${stamp}/${crypto.randomUUID()}.${extension}`;
  try {
    const { signedUrl } = await storage.createSignedUploadUrl(objectPath, { upsert: false });
    if (typeof signedUrl !== "string" || !signedUrl) throw new Error("storage_request_failed");
    return json({ objectPath, uploadUrl: signedUrl, maxBytes: spec.maxBytes });
  } catch {
    return json({ error: "storage_request_failed" }, 503);
  }
}

async function sendMediaMessage(request, supabase, storage) {
  if (request.method !== "POST") return methodNotAllowed("POST");
  const body = await readJson(request);
  const identity = parseIdentity(body);
  const kind = body?.kind;
  const spec = MEDIA_KINDS[kind];
  if (!body || !identity || !spec) return json({ error: "invalid_payload" }, 400);

  const contentType = typeof body.contentType === "string" ? body.contentType.toLowerCase().split(";")[0].trim() : "";
  const pathMatch = typeof body.objectPath === "string" ? MEDIA_PATH.exec(body.objectPath) : null;
  if (!pathMatch || spec.contentTypeExt[contentType] !== pathMatch[1]) {
    return json({ error: "invalid_payload" }, 400);
  }
  const size = body.size;
  if (!Number.isSafeInteger(size) || size < 1 || size > spec.maxBytes) {
    return json({ error: "invalid_media_size" }, 400);
  }
  const caption = readCaption(body.caption);
  if (caption.error) return json({ error: "invalid_caption" }, 400);

  try {
    // Browser-reported size/type are not proof; the stored object is re-read and measured.
    await verifyUploadedObject(await storage.download(body.objectPath), {
      maxBytes: spec.maxBytes,
      expectedBytes: size,
      allowedContentTypes: [contentType],
    });
  } catch {
    // Rejected upload stays out of completed records; cleanup is best-effort.
    try {
      await storage.remove([body.objectPath]);
    } catch {}
    return json({ error: "upload_verification_failed" }, 400);
  }

  let reply;
  try {
    reply = await resolveReply(supabase, body.replyToId);
  } catch {
    return json({ error: "database_request_failed" }, 503);
  }
  if (reply.invalid) return json({ error: "invalid_reply" }, 400);

  const row = {
    id: crypto.randomUUID(),
    sender_name: identity.name,
    sender_avatar: identity.avatar,
    sender_token_hash: await sha256Hex(identity.token),
    kind,
    body: caption.caption,
    media_path: body.objectPath,
    reply_to_id: reply.id ?? null,
    reply_to_name: reply.name ?? null,
    reply_to_gist: reply.gist ?? null,
    edited_at: null,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("messages").insert(row).select(COLUMNS).single();
  if (error || !data) return json({ error: "database_request_failed" }, 503);
  return json({ item: toItem(data) });
}

async function editMessage(request, supabase) {
  if (request.method !== "POST") return methodNotAllowed("POST");
  const body = await readJson(request);
  const identity = parseIdentity(body);
  if (!body || !identity) return json({ error: "invalid_payload" }, 400);
  if (typeof body.id !== "string" || !UUID.test(body.id)) return json({ error: "invalid_payload" }, 400);
  const text = readText(body.text, MAX_TEXT);
  if (!text) return json({ error: "invalid_text" }, 400);

  const { data, error } = await supabase
    .from("messages")
    .update({ body: text, edited_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("sender_token_hash", await sha256Hex(identity.token))
    .eq("kind", "text")
    .select("id,body,edited_at")
    .maybeSingle();
  if (error) return json({ error: "database_request_failed" }, 503);
  if (!data) return json({ error: "not_allowed" }, 403);
  return json({ item: { id: data.id, body: data.body, editedAt: data.edited_at } });
}

async function deleteMessage(request, supabase, storage) {
  if (request.method !== "POST") return methodNotAllowed("POST");
  const body = await readJson(request);
  const identity = parseIdentity(body);
  if (!body || !identity) return json({ error: "invalid_payload" }, 400);
  if (typeof body.id !== "string" || !UUID.test(body.id)) return json({ error: "invalid_payload" }, 400);
  const tokenHash = await sha256Hex(identity.token);

  const { data: existing, error: readError } = await supabase
    .from("messages")
    .select("id,media_path")
    .eq("id", body.id)
    .eq("sender_token_hash", tokenHash)
    .maybeSingle();
  if (readError) return json({ error: "database_request_failed" }, 503);
  if (!existing) return json({ error: "not_allowed" }, 403);

  const { data: removed, error: deleteError } = await supabase
    .from("messages")
    .delete()
    .eq("id", body.id)
    .eq("sender_token_hash", tokenHash)
    .select("id")
    .maybeSingle();
  if (deleteError) return json({ error: "database_request_failed" }, 503);
  if (!removed) return json({ error: "not_allowed" }, 403);

  if (existing.media_path) {
    try {
      await storage.remove([existing.media_path]);
    } catch {}
  }
  return json({ ok: true, id: body.id });
}

async function signMediaUrls(request, supabase, storage) {
  if (request.method !== "POST") return methodNotAllowed("POST");
  const body = await readJson(request);
  const ids = body?.ids;
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > MAX_SIGN_IDS) {
    return json({ error: "invalid_payload" }, 400);
  }
  for (const id of ids) {
    if (typeof id !== "string" || !UUID.test(id)) return json({ error: "invalid_payload" }, 400);
  }
  const unique = [...new Set(ids)];
  const { data, error } = await supabase.from("messages").select("id,media_path").in("id", unique);
  if (error || !Array.isArray(data)) return json({ error: "database_request_failed" }, 503);

  // Messages in this room are public by design, so signed media URLs are not
  // gated further; paths stay server-side and only short-lived URLs are returned.
  const items = [];
  for (const row of data) {
    if (!row.media_path) continue;
    try {
      const { signedUrl } = await storage.createSignedUrl(row.media_path, SIGNED_URL_TTL);
      if (typeof signedUrl === "string" && signedUrl) {
        items.push({ id: row.id, url: signedUrl, expiresIn: SIGNED_URL_TTL });
      }
    } catch {
      // skip this object; the client retries it on the next poll
    }
  }
  return json({ items });
}

export async function handleApp({ request, supabase, storage }) {
  const action = new URL(request.url).searchParams.get("action");
  switch (action) {
    case "list":
      return listMessages(request, supabase);
    case "send":
      return sendMessage(request, supabase);
    case "upload-intent":
      return createUploadIntent(request, storage);
    case "send-media":
      return sendMediaMessage(request, supabase, storage);
    case "edit":
      return editMessage(request, supabase);
    case "delete":
      return deleteMessage(request, supabase, storage);
    case "sign-media":
      return signMediaUrls(request, supabase, storage);
    default:
      return json({ error: "not_found" }, 404);
  }
}
