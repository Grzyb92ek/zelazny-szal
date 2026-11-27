const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
const publicFields = "nickname,character_class,level,round,wins,score,ended_at,game_version";
const sortOrder = "score.desc,round.desc,level.desc,run_id.asc";
const maxBodyBytes = 2048;

function reply(value, status = 200, headers = {}) {
  return Response.json(value, {
    status,
    headers: {...cors, "Cache-Control": "no-store", ...headers}
  });
}

export function validateScore(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const {run_id, character_class, round, level, wins, uncommon, score, game_version, ended_at} = input;
  const nickname = typeof input.nickname === "string" ? input.nickname.trim() : "";
  if (!nickname || nickname.length > 24 || /[\p{Cc}\p{Cs}\u202a-\u202e\u2066-\u2069]/u.test(nickname)) return null;
  if (typeof run_id !== "string" || !/^[\da-f]{8}(?:-[\da-f]{4}){2}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(run_id) ||
      run_id[14] !== "4") return null;
  if (character_class !== "barbarian" ||
      typeof game_version !== "string" || !/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(game_version)) return null;
  if (![round, level, wins, uncommon, score].every(Number.isSafeInteger) ||
      round < 1 || round > 10000 || level < 1 || level > 10000 || wins !== round - 1 ||
      uncommon < 0 || uncommon > 6 || score !== 100 * wins + 50 * (level - 1) + 25 * uncommon) return null;
  const endedAt = typeof ended_at === "string" ? new Date(ended_at) : new Date(NaN);
  if (!Number.isFinite(endedAt.getTime()) || endedAt.toISOString() !== ended_at ||
      endedAt.getUTCFullYear() < 2000 || endedAt.getTime() > Date.now() + 300000) return null;
  return {run_id, nickname, character_class, round, level, wins, uncommon, score, game_version, ended_at};
}

async function readScore(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) return null;
  if (!request.body || Number(request.headers.get("content-length")) > maxBodyBytes) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", {fatal: true});
  let bytes = 0, json = "";
  try {
    for (;;) {
      const {value, done} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBodyBytes) {
        void reader.cancel();
        return null;
      }
      json += decoder.decode(value, {stream: true});
    }
    return validateScore(JSON.parse(json + decoder.decode()));
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

async function rateBucket(request, secret) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "";
  const address = /^[\da-f.:]{2,45}$/i.test(forwarded) ? forwarded : "unknown";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), {name: "HMAC", hash: "SHA-256"}, false, ["sign"]);
  const hash = await crypto.subtle.sign("HMAC", key, encoder.encode(address));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function createRankingHandler({projectUrl, serviceKey, rateSecret, fetchDb = fetch}) {
  return async request => {
    if (request.method === "OPTIONS") return new Response(null, {status: 204, headers: cors});
    if (request.method !== "GET" && request.method !== "POST") {
      return reply({error: "method_not_allowed"}, 405, {Allow: "GET, POST, OPTIONS"});
    }
    if (!projectUrl || !serviceKey || !rateSecret || rateSecret.length < 32) return reply({error: "unavailable"}, 503);
    const headers = {apikey: serviceKey};
    if (!serviceKey.startsWith("sb_secret_")) headers.Authorization = "Bearer " + serviceKey;
    const database = projectUrl + "/rest/v1/";

    try {
      if (request.method === "GET") {
        const query = new URLSearchParams({select: publicFields, order: sortOrder, limit: "100"});
        const response = await fetchDb(database + "global_ranking_scores?" + query, {
          headers, signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) throw new Error("Ranking query failed");
        return reply(await response.json(), 200, {"Cache-Control": "public, max-age=15"});
      }

      const entry = await readScore(request);
      if (!entry) return reply({error: "invalid_score"}, 400);
      const bucket = await rateBucket(request, rateSecret);
      const response = await fetchDb(database + "rpc/submit_global_ranking_score", {
        method: "POST",
        headers: {...headers, "Content-Type": "application/json"},
        body: JSON.stringify({p_bucket: bucket, p_entry: entry}),
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) throw new Error("Ranking write failed");
      const result = await response.json();
      if (result === "rate_limited") return reply({error: result}, 429, {"Retry-After": String(3600 - Math.floor(Date.now() / 1000) % 3600)});
      if (result === "created") return reply({status: result}, 201);
      if (result === "duplicate") return reply({status: result});
      throw new Error("Unknown ranking write result");
    } catch {
      return reply({error: "unavailable"}, 503);
    }
  };
}
