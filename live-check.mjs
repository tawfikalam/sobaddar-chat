// Deployed-site integration check: one disposable round trip, cleaned up at the end.
const BASE = "https://sobaddar-chat-uwkb24a9xcy.qoder.website";
const APP = `${BASE}/functions/v1/app`;
const TOKEN = crypto.randomUUID();

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
  const response = await fetch(`${APP}?action=${action}${params}`, {
    method,
    headers: {
      origin: BASE,
      ...(body ? { "content-type": "application/json" } : {}),
      ...(token ? { "x-device-token": token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, json: await response.json().catch(() => null) };
};

const identity = { name: "টেস্ট রোবট", avatar: "🤖", token: TOKEN };

// 1. site + list reachable anonymously
const baseline = await call("list");
check("list reachable", baseline.status === 200 && Array.isArray(baseline.json?.items), `${baseline.status} ${JSON.stringify(baseline.json)?.slice(0, 120)}`);

// 2. send text through the deployed Function and DB
const sent = await call("send", { method: "POST", body: { ...identity, text: "লাইভ টেস্ট মেসেজ" } });
check("send text", sent.status === 200 && sent.json?.item?.body === "লাইভ টেস্ট মেসেজ", JSON.stringify(sent.json)?.slice(0, 160));
const textId = sent.json?.item?.id;

// 3. ownership flag round trip
const listed = await call("list", { token: TOKEN });
const own = listed.json?.items?.find((item) => item.id === textId);
check("mine flag for own token", own?.mine === true, JSON.stringify(own)?.slice(0, 160));

// 4. storage upload: intent -> PUT -> send-media
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4, 5, 6, 7, 8]);
const intent = await call("upload-intent", {
  method: "POST",
  body: { ...identity, kind: "image", size: png.byteLength, contentType: "image/png" },
});
check("upload intent", intent.status === 200 && typeof intent.json?.uploadUrl === "string", JSON.stringify(intent.json)?.slice(0, 160));
const putResponse = await fetch(new URL(intent.json.uploadUrl, BASE).href, {
  method: "PUT",
  headers: { "content-type": "image/png", origin: BASE },
  body: png,
});
check("signed upload PUT", putResponse.ok, String(putResponse.status));

const media = await call("send-media", {
  method: "POST",
  body: { ...identity, kind: "image", objectPath: intent.json.objectPath, size: png.byteLength, contentType: "image/png", caption: "লাইভ টেস্ট ছবি" },
});
check("send-media", media.status === 200 && media.json?.item?.hasMedia === true, JSON.stringify(media.json)?.slice(0, 160));
const mediaId = media.json?.item?.id;

// 5. sign + fetch real bytes from Storage
const signed = await call("sign-media", { method: "POST", body: { ids: [mediaId] } });
const mediaUrl = signed.json?.items?.[0]?.url;
check("sign-media", signed.status === 200 && typeof mediaUrl === "string", JSON.stringify(signed.json)?.slice(0, 160));
if (mediaUrl) {
  const mediaResponse = await fetch(new URL(mediaUrl, BASE).href);
  const bytes = new Uint8Array(await mediaResponse.arrayBuffer());
  check(
    "media fetch bytes",
    mediaResponse.status === 200 && mediaResponse.headers.get("content-type") === "image/png" && bytes.byteLength === png.byteLength,
    `${mediaResponse.status} ${bytes.byteLength}`
  );
}

// 6. voice message: intent -> PUT -> send-media -> sign -> bytes -> reply gist
const voice = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x93, 0x42, 0x82, 0x88, 0x6d, 0x61, 0x74, 0x72, 0x6f, 0x73, 0x6b, 0x61]);
const voiceIntent = await call("upload-intent", {
  method: "POST",
  body: { ...identity, kind: "audio", size: voice.byteLength, contentType: "audio/webm" },
});
check(
  "voice upload intent",
  voiceIntent.status === 200 && typeof voiceIntent.json?.uploadUrl === "string" && String(voiceIntent.json?.objectPath).endsWith(".webm"),
  JSON.stringify(voiceIntent.json)?.slice(0, 160)
);
const voicePut = await fetch(new URL(voiceIntent.json.uploadUrl, BASE).href, {
  method: "PUT",
  headers: { "content-type": "audio/webm", origin: BASE },
  body: voice,
});
check("voice signed upload PUT", voicePut.ok, String(voicePut.status));

const voiceMsg = await call("send-media", {
  method: "POST",
  body: { ...identity, kind: "audio", objectPath: voiceIntent.json.objectPath, size: voice.byteLength, contentType: "audio/webm" },
});
check(
  "send voice message",
  voiceMsg.status === 200 && voiceMsg.json?.item?.kind === "audio" && voiceMsg.json?.item?.hasMedia === true,
  JSON.stringify(voiceMsg.json)?.slice(0, 160)
);
const voiceId = voiceMsg.json?.item?.id;

const voiceSigned = await call("sign-media", { method: "POST", body: { ids: [voiceId] } });
const voiceUrl = voiceSigned.json?.items?.[0]?.url;
check("sign voice media", voiceSigned.status === 200 && typeof voiceUrl === "string", JSON.stringify(voiceSigned.json)?.slice(0, 160));
if (voiceUrl) {
  const voiceResponse = await fetch(new URL(voiceUrl, BASE).href);
  const voiceBytes = new Uint8Array(await voiceResponse.arrayBuffer());
  check(
    "voice fetch bytes",
    voiceResponse.status === 200 && voiceResponse.headers.get("content-type") === "audio/webm" && voiceBytes.byteLength === voice.byteLength,
    `${voiceResponse.status} ${voiceBytes.byteLength}`
  );
}

const voiceReply = await call("send", { method: "POST", body: { ...identity, text: "ভয়েসে রিপ্লাই", replyToId: voiceId } });
check(
  "voice reply gist",
  voiceReply.status === 200 && voiceReply.json?.item?.reply?.gist === "[ভয়েস মেসেজ]",
  JSON.stringify(voiceReply.json)?.slice(0, 160)
);
const voiceReplyId = voiceReply.json?.item?.id;

// 6b. video message: intent -> PUT -> send-media -> sign -> bytes -> reply gist
const mp4 = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32, 0x00, 0x00, 0x00, 0x00, 0x6d, 0x70, 0x34, 0x32]);
const videoIntent = await call("upload-intent", {
  method: "POST",
  body: { ...identity, kind: "video", size: mp4.byteLength, contentType: "video/mp4" },
});
check(
  "video upload intent",
  videoIntent.status === 200 && typeof videoIntent.json?.uploadUrl === "string" && String(videoIntent.json?.objectPath).endsWith(".mp4"),
  JSON.stringify(videoIntent.json)?.slice(0, 160)
);
const videoPut = await fetch(new URL(videoIntent.json.uploadUrl, BASE).href, {
  method: "PUT",
  headers: { "content-type": "video/mp4", origin: BASE },
  body: mp4,
});
check("video signed upload PUT", videoPut.ok, String(videoPut.status));

const videoMsg = await call("send-media", {
  method: "POST",
  body: { ...identity, kind: "video", objectPath: videoIntent.json.objectPath, size: mp4.byteLength, contentType: "video/mp4", caption: "লাইভ টেস্ট ভিডিও" },
});
check(
  "send video message",
  videoMsg.status === 200 && videoMsg.json?.item?.kind === "video" && videoMsg.json?.item?.hasMedia === true,
  JSON.stringify(videoMsg.json)?.slice(0, 160)
);
const videoId = videoMsg.json?.item?.id;

const videoSigned = await call("sign-media", { method: "POST", body: { ids: [videoId] } });
const videoUrl = videoSigned.json?.items?.[0]?.url;
check("sign video media", videoSigned.status === 200 && typeof videoUrl === "string", JSON.stringify(videoSigned.json)?.slice(0, 160));
if (videoUrl) {
  const videoResponse = await fetch(new URL(videoUrl, BASE).href);
  const videoBytes = new Uint8Array(await videoResponse.arrayBuffer());
  check(
    "video fetch bytes",
    videoResponse.status === 200 && videoResponse.headers.get("content-type") === "video/mp4" && videoBytes.byteLength === mp4.byteLength,
    `${videoResponse.status} ${videoBytes.byteLength}`
  );
}

const videoReply = await call("send", { method: "POST", body: { ...identity, text: "ভিডিওতে রিপ্লাই", replyToId: videoId } });
check(
  "video reply gist",
  videoReply.status === 200 && videoReply.json?.item?.reply?.gist === "[ভিডিও]",
  JSON.stringify(videoReply.json)?.slice(0, 160)
);
const videoReplyId = videoReply.json?.item?.id;

// 7. cleanup: delete all sent messages, verify removal
const deleteText = await call("delete", { method: "POST", body: { ...identity, id: textId } });
check("delete text", deleteText.status === 200 && deleteText.json?.ok === true, JSON.stringify(deleteText.json)?.slice(0, 160));
const deleteMedia = await call("delete", { method: "POST", body: { ...identity, id: mediaId } });
check("delete media", deleteMedia.status === 200 && deleteMedia.json?.ok === true, JSON.stringify(deleteMedia.json)?.slice(0, 160));
const deleteVoiceReply = await call("delete", { method: "POST", body: { ...identity, id: voiceReplyId } });
check("delete voice reply", deleteVoiceReply.status === 200 && deleteVoiceReply.json?.ok === true, JSON.stringify(deleteVoiceReply.json)?.slice(0, 160));
const deleteVoice = await call("delete", { method: "POST", body: { ...identity, id: voiceId } });
check("delete voice message", deleteVoice.status === 200 && deleteVoice.json?.ok === true, JSON.stringify(deleteVoice.json)?.slice(0, 160));
const deleteVideoReply = await call("delete", { method: "POST", body: { ...identity, id: videoReplyId } });
check("delete video reply", deleteVideoReply.status === 200 && deleteVideoReply.json?.ok === true, JSON.stringify(deleteVideoReply.json)?.slice(0, 160));
const deleteVideo = await call("delete", { method: "POST", body: { ...identity, id: videoId } });
check("delete video message", deleteVideo.status === 200 && deleteVideo.json?.ok === true, JSON.stringify(deleteVideo.json)?.slice(0, 160));

const finalList = await call("list");
check(
  "test messages removed",
  !finalList.json?.items?.some((item) => [textId, mediaId, voiceId, voiceReplyId, videoId, videoReplyId].includes(item.id)),
  JSON.stringify(finalList.json)?.slice(0, 200)
);
if (mediaUrl) {
  const goneResponse = await fetch(new URL(mediaUrl, BASE).href);
  check("media removed from storage", !goneResponse.ok, String(goneResponse.status));
}
if (videoUrl) {
  const goneVideo = await fetch(new URL(videoUrl, BASE).href);
  check("video removed from storage", !goneVideo.ok, String(goneVideo.status));
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
