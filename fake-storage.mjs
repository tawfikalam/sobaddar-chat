// Credential-free in-memory stand-in for the injected platform storage module.
// Signed URLs route back through the local dev server so the browser flow
// (signed upload PUT, signed media GET) works end to end without the platform.
export function createFakeStorage() {
  const objects = new Map();
  const uploadNonces = new Map();
  const downloadNonces = new Map();
  const noStore = { "cache-control": "no-store" };

  return {
    async createSignedUploadUrl(objectPath) {
      const nonce = crypto.randomUUID();
      uploadNonces.set(nonce, objectPath);
      return { signedUrl: `/functions/v1/app?action=__fake-upload&nonce=${nonce}` };
    },

    async createSignedUrl(objectPath, expiresIn) {
      if (!objects.has(objectPath)) throw new Error("object_not_found");
      const nonce = crypto.randomUUID();
      downloadNonces.set(nonce, { objectPath, expiresAt: Date.now() + expiresIn * 1000 });
      return { signedUrl: `/functions/v1/app?action=__fake-media&nonce=${nonce}` };
    },

    async download(objectPath) {
      const object = objects.get(objectPath);
      if (!object) throw new Error("object_not_found");
      return new Response(object.bytes, { headers: { "content-type": object.contentType } });
    },

    async remove(objectPaths) {
      const removed = [];
      for (const objectPath of objectPaths) {
        if (objects.delete(objectPath)) removed.push(objectPath);
      }
      return { removed };
    },

    // ---- local-only routes used by dev/function-local.ts ----

    async handleUpload(request, nonce) {
      const objectPath = uploadNonces.get(nonce);
      if (!objectPath) return Response.json({ error: "invalid_nonce" }, { status: 404, headers: noStore });
      if (request.method !== "PUT") return Response.json({ error: "method_not_allowed" }, { status: 405, headers: noStore });
      const contentType = (request.headers.get("content-type") || "application/octet-stream").split(";")[0].trim().toLowerCase();
      const bytes = new Uint8Array(await request.arrayBuffer());
      objects.set(objectPath, { bytes, contentType });
      uploadNonces.delete(nonce);
      return Response.json({ ok: true }, { headers: noStore });
    },

    handleMedia(nonce) {
      const entry = downloadNonces.get(nonce);
      if (!entry || entry.expiresAt < Date.now()) {
        return new Response("signed_url_expired", { status: 404, headers: noStore });
      }
      const object = objects.get(entry.objectPath);
      if (!object) return new Response("not_found", { status: 404, headers: noStore });
      return new Response(object.bytes, {
        headers: { "content-type": object.contentType, "cache-control": "no-store" },
      });
    },
  };
}
