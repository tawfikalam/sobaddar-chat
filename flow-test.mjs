// Local main-flow check against the dev fixture server (not part of the site).
const BASE = "http://127.0.0.1:8000/functions/v1/app";
const TOKEN_A = "11111111-2222-4333-8444-555555555555";
const TOKEN_B = "99999999-8888-4777-8666-555555555555";

let passed = 0;
let failed = 0;
const check = (label, ok, detail = "") => {
  if (ok) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.log(`FAIL ${label} ${detail}`);
  }
};

const call = async (action, { method = "GET", body, params = "", token } = {}) => {
  const response = await fetch(`${BASE}?action=${action}${params}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(token ? { "x-device-token": token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, json: await response.json().catch(() => null) };
};

const identity = { name: "রাফি", avatar: "🦊", token: TOKEN_A };
const other = { name: "সারা", avatar: "🐼", token: TOKEN_B };

// 1. send a text message
const sent = await call("send", { method: "POST", body: { ...identity, text: "প্রথম মেসেজ!" } });
check("send text", sent.status === 200 && sent.json?.item?.body === "প্রথম মেসেজ!" && sent.json.item.reply === null, JSON.stringify(sent.json));
const textId = sent.json?.item?.id;

// 2. list contains it
const listed = await call("list");
check("list contains message", listed.json?.items?.some((item) => item.id === textId), JSON.stringify(listed.json));

// 2b. list marks ownership via the device token without leaking hashes
const mineA = await call("list", { token: TOKEN_A });
const mineB = await call("list", { token: TOKEN_B });
const itemForA = mineA.json?.items?.find((item) => item.id === textId);
const itemForB = mineB.json?.items?.find((item) => item.id === textId);
check("mine flag true for own token", itemForA?.mine === true, JSON.stringify(itemForA));
check("mine flag false for other token", itemForB?.mine === false, JSON.stringify(itemForB));
check("token hash never returned", mineA.json?.items?.every((item) => !("sender_token_hash" in item)), JSON.stringify(mineA.json?.items?.[0]));

// 3. reply to it
const replied = await call("send", { method: "POST", body: { ...other, text: "রিপ্লাই!", replyToId: textId } });
check(
  "reply snapshot",
  replied.status === 200 && replied.json?.item?.reply?.id === textId && replied.json.item.reply.name === "রাফি",
  JSON.stringify(replied.json)
);

// 4. edit rules
const editWrong = await call("edit", { method: "POST", body: { ...other, id: textId, text: "হ্যাক" } });
check("edit wrong token rejected", editWrong.status === 403, JSON.stringify(editWrong.json));
const editRight = await call("edit", { method: "POST", body: { ...identity, id: textId, text: "এডিট করা টেক্সট" } });
check("edit own message", editRight.status === 200 && editRight.json?.item?.editedAt && editRight.json.item.body === "এডিট করা টেক্সট", JSON.stringify(editRight.json));

// 5. upload intent + PUT + send-media
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4, 5, 6, 7, 8]);
const intent = await call("upload-intent", {
  method: "POST",
  body: { ...identity, kind: "image", size: png.byteLength, contentType: "image/png" },
});
check(
  "upload intent",
  intent.status === 200 && typeof intent.json?.objectPath === "string" && intent.json.objectPath.endsWith(".png") && /^\/functions\/v1\/app\?/.test(intent.json.uploadUrl),
  JSON.stringify(intent.json)
);
const putResponse = await fetch(`http://127.0.0.1:8000${intent.json.uploadUrl}`, {
  method: "PUT",
  headers: { "content-type": "image/png" },
  body: png,
});
check("signed upload PUT", putResponse.status === 200, String(putResponse.status));

const media = await call("send-media", {
  method: "POST",
  body: { ...identity, kind: "image", objectPath: intent.json.objectPath, size: png.byteLength, contentType: "image/png", caption: "টেস্ট ছবি", replyToId: textId },
});
check("send-media", media.status === 200 && media.json?.item?.hasMedia === true && media.json.item.kind === "image", JSON.stringify(media.json));
const mediaId = media.json?.item?.id;

// 6. sign + fetch media bytes
const signed = await call("sign-media", { method: "POST", body: { ids: [mediaId] } });
const mediaUrl = signed.json?.items?.[0]?.url;
check("sign-media", signed.status === 200 && typeof mediaUrl === "string", JSON.stringify(signed.json));
if (mediaUrl) {
  const mediaResponse = await fetch(`http://127.0.0.1:8000${mediaUrl}`);
  const bytes = new Uint8Array(await mediaResponse.arrayBuffer());
  check("media fetch bytes", mediaResponse.status === 200 && mediaResponse.headers.get("content-type") === "image/png" && bytes.byteLength === png.byteLength, `${mediaResponse.status} ${bytes.byteLength}`);
}

// 6b. voice message round trip (webm) + reply gist
const voice = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x93, 0x42, 0x82, 0x88, 0x6d, 0x61, 0x74, 0x72, 0x6f, 0x73, 0x6b, 0x61]);
const voiceIntent = await call("upload-intent", {
  method: "POST",
  body: { ...identity, kind: "audio", size: voice.byteLength, contentType: "audio/webm" },
});
check(
  "voice upload intent",
  voiceIntent.status === 200 && typeof voiceIntent.json?.objectPath === "string" && voiceIntent.json.objectPath.endsWith(".webm"),
  JSON.stringify(voiceIntent.json)
);
await fetch(`http://127.0.0.1:8000${voiceIntent.json.uploadUrl}`, { method: "PUT", headers: { "content-type": "audio/webm" }, body: voice });
const voiceMedia = await call("send-media", {
  method: "POST",
  body: { ...identity, kind: "audio", objectPath: voiceIntent.json.objectPath, size: voice.byteLength, contentType: "audio/webm" },
});
check("send voice message", voiceMedia.status === 200 && voiceMedia.json?.item?.kind === "audio" && voiceMedia.json.item.hasMedia === true, JSON.stringify(voiceMedia.json));
const voiceId = voiceMedia.json?.item?.id;
const voiceSigned = await call("sign-media", { method: "POST", body: { ids: [voiceId] } });
const voiceUrl = voiceSigned.json?.items?.[0]?.url;
check("sign voice media", typeof voiceUrl === "string", JSON.stringify(voiceSigned.json));
if (voiceUrl) {
  const voiceResponse = await fetch(`http://127.0.0.1:8000${voiceUrl}`);
  check("voice fetch bytes", voiceResponse.status === 200 && voiceResponse.headers.get("content-type") === "audio/webm", String(voiceResponse.status));
}
const voiceReply = await call("send", { method: "POST", body: { ...other, text: "ভয়েসের রিপ্লাই", replyToId: voiceId } });
check("voice reply gist", voiceReply.status === 200 && voiceReply.json?.item?.reply?.gist === "[ভয়েস মেসেজ]", JSON.stringify(voiceReply.json));
await call("delete", { method: "POST", body: { ...other, id: voiceReply.json?.item?.id } });
const deleteVoice = await call("delete", { method: "POST", body: { ...identity, id: voiceId } });
check("delete voice message", deleteVoice.status === 200 && deleteVoice.json?.ok === true, JSON.stringify(deleteVoice.json));

// 6c. avif image accepted end to end
const avifIntent = await call("upload-intent", {
  method: "POST",
  body: { ...identity, kind: "image", size: png.byteLength, contentType: "image/avif" },
});
check(
  "avif upload intent",
  avifIntent.status === 200 && avifIntent.json?.objectPath?.endsWith(".avif") === true,
  JSON.stringify(avifIntent.json)
);
await fetch(`http://127.0.0.1:8000${avifIntent.json.uploadUrl}`, { method: "PUT", headers: { "content-type": "image/avif" }, body: png });
const avifMedia = await call("send-media", {
  method: "POST",
  body: { ...identity, kind: "image", objectPath: avifIntent.json.objectPath, size: png.byteLength, contentType: "image/avif" },
});
check("send avif image", avifMedia.status === 200 && avifMedia.json?.item?.kind === "image", JSON.stringify(avifMedia.json));
await call("delete", { method: "POST", body: { ...identity, id: avifMedia.json?.item?.id } });

// 6d. video message round trip (mp4) + reply gist
const mp4 = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32, 0x00, 0x00, 0x00, 0x00, 0x6d, 0x70, 0x34, 0x32]);
const videoIntent = await call("upload-intent", {
  method: "POST",
  body: { ...identity, kind: "video", size: mp4.byteLength, contentType: "video/mp4" },
});
check(
  "video upload intent",
  videoIntent.status === 200 && videoIntent.json?.objectPath?.endsWith(".mp4") === true,
  JSON.stringify(videoIntent.json)
);
await fetch(`http://127.0.0.1:8000${videoIntent.json.uploadUrl}`, { method: "PUT", headers: { "content-type": "video/mp4" }, body: mp4 });
const videoMedia = await call("send-media", {
  method: "POST",
  body: { ...identity, kind: "video", objectPath: videoIntent.json.objectPath, size: mp4.byteLength, contentType: "video/mp4", caption: "টেস্ট ভিডিও" },
});
check("send video message", videoMedia.status === 200 && videoMedia.json?.item?.kind === "video" && videoMedia.json.item.hasMedia === true, JSON.stringify(videoMedia.json));
const videoId = videoMedia.json?.item?.id;
const videoSigned = await call("sign-media", { method: "POST", body: { ids: [videoId] } });
const videoUrl = videoSigned.json?.items?.[0]?.url;
check("sign video media", typeof videoUrl === "string", JSON.stringify(videoSigned.json));
if (videoUrl) {
  const videoResponse = await fetch(`http://127.0.0.1:8000${videoUrl}`);
  const videoBytes = new Uint8Array(await videoResponse.arrayBuffer());
  check(
    "video fetch bytes",
    videoResponse.status === 200 && videoResponse.headers.get("content-type") === "video/mp4" && videoBytes.byteLength === mp4.byteLength,
    `${videoResponse.status} ${videoBytes.byteLength}`
  );
}
const videoReply = await call("send", { method: "POST", body: { ...other, text: "ভিডিওর রিপ্লাই", replyToId: videoId } });
check("video reply gist", videoReply.status === 200 && videoReply.json?.item?.reply?.gist === "[ভিডিও]", JSON.stringify(videoReply.json));
await call("delete", { method: "POST", body: { ...other, id: videoReply.json?.item?.id } });
const deleteVideo = await call("delete", { method: "POST", body: { ...identity, id: videoId } });
check("delete video message", deleteVideo.status === 200 && deleteVideo.json?.ok === true, JSON.stringify(deleteVideo.json));
if (videoUrl) {
  const goneVideo = await fetch(`http://127.0.0.1:8000${videoUrl}`);
  check("video removed from storage", goneVideo.status === 404, String(goneVideo.status));
}

// 7. send-media with a lying size must be rejected and the object cleaned up
const badIntent = await call("upload-intent", {
  method: "POST",
  body: { ...identity, kind: "image", size: png.byteLength, contentType: "image/png" },
});
await fetch(`http://127.0.0.1:8000${badIntent.json.uploadUrl}`, { method: "PUT", headers: { "content-type": "image/png" }, body: png });
const badMedia = await call("send-media", {
  method: "POST",
  body: { ...identity, kind: "image", objectPath: badIntent.json.objectPath, size: png.byteLength + 5, contentType: "image/png" },
});
check("lying size rejected", badMedia.status === 400 && badMedia.json?.error === "upload_verification_failed", JSON.stringify(badMedia.json));

// 8. delete rules
const deleteWrong = await call("delete", { method: "POST", body: { ...other, id: textId } });
check("delete wrong token rejected", deleteWrong.status === 403, JSON.stringify(deleteWrong.json));
const deleteRight = await call("delete", { method: "POST", body: { ...identity, id: textId } });
check("delete own message", deleteRight.status === 200 && deleteRight.json?.ok === true, JSON.stringify(deleteRight.json));
const deleteMedia = await call("delete", { method: "POST", body: { ...identity, id: mediaId } });
check("delete own media message", deleteMedia.status === 200 && deleteMedia.json?.ok === true, JSON.stringify(deleteMedia.json));
if (mediaUrl) {
  const goneResponse = await fetch(`http://127.0.0.1:8000${mediaUrl}`);
  check("media removed from storage", goneResponse.status === 404, String(goneResponse.status));
}

// 9. protocol edges
const badMethod = await call("send", { method: "GET" });
check("wrong method 405", badMethod.status === 405, String(badMethod.status));
const unknown = await call("bogus");
check("unknown action 404", unknown.status === 404, String(unknown.status));
const badCursor = await call("list", { params: "&before_created=oops&before_id=nope" });
check("invalid cursor 400", badCursor.status === 400, String(badCursor.status));
const badEdit = await call("edit", { method: "POST", body: { ...identity, id: "not-a-uuid", text: "x" } });
check("invalid id rejected", badEdit.status === 400, String(badEdit.status));

// 10. older-page pagination
const preExisting = await call("list");
const preCount = preExisting.json?.items?.length ?? 0;
for (let i = 0; i < 55; i += 1) {
  await call("send", { method: "POST", body: { ...identity, text: `পুরুনো ${i}` } });
}
const firstPage = await call("list");
// 55 new + the reply message that survived the deletes above, plus rows left by earlier runs; capped at the 100-item window
const expectedWindow = Math.min(100, preCount + 56);
check("window holds all messages", firstPage.json?.items?.length === expectedWindow, String(firstPage.json?.items?.length));
const oldest = firstPage.json.items[0];
const olderPage = await call("list", { params: `&before_created=${encodeURIComponent(oldest.createdAt)}&before_id=${oldest.id}` });
check("older page", olderPage.status === 200 && Array.isArray(olderPage.json?.items) && olderPage.json.items.length <= 50, JSON.stringify(olderPage.json));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
