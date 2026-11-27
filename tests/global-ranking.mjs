import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFile} from "node:fs/promises";
import vm from "node:vm";
import {createRankingHandler, validateScore} from "../supabase/functions/global-ranking/handler.mjs";

globalThis.crypto ??= webcrypto;
const entry = {
  run_id: "1015a210-3d17-497a-92d7-e904040b96ee",
  nickname: "<img src=x onerror=x>",
  character_class: "barbarian",
  level: 3, round: 6, wins: 5, uncommon: 2, score: 650,
  game_version: "1.6.0", ended_at: "2026-01-01T00:00:00.000Z"
};
assert.deepEqual(validateScore(entry), entry);
for (const changes of [
  {score: 651}, {score: "650"}, {wins: 6}, {level: 0}, {round: 10001},
  {uncommon: 7}, {character_class: "../other"}, {character_subclass: "<berserk>"}, {run_id: "bad"}, {game_version: "../1"},
  {nickname: "x\ny"}, {nickname: "x".repeat(25)}, {ended_at: "2026-02-30T00:00:00.000Z"}
]) assert.equal(validateScore({...entry, ...changes}), null);
const withSubclass={...entry,character_subclass:"berserk"};
assert.deepEqual(validateScore(withSubclass),withSubclass);

const endpoint = "https://test.supabase.co/functions/v1/global-ranking";
const databaseCalls = [];
const dbResults = [
  Response.json([]), Response.json("created"), Response.json("duplicate"),
  Response.json("rate_limited"), new Response(null, {status: 500})
];
const handler = createRankingHandler({
  projectUrl: "https://test.supabase.co", serviceKey: "server-test-key", rateSecret: "x".repeat(32),
  fetchDb: async (url, options) => {
    databaseCalls.push({url: new URL(url), options});
    return dbResults.shift();
  }
});
const post = body => new Request(endpoint, {
  method: "POST",
  headers: {"Content-Type": "application/json", "X-Forwarded-For": "203.0.113.1", Origin: "null"},
  body
});
assert.equal((await handler(new Request(endpoint, {method: "OPTIONS"}))).headers.get("Access-Control-Allow-Origin"), "*");
assert.equal((await handler(new Request(endpoint, {method: "PUT"}))).status, 405);
assert.equal((await handler(post(JSON.stringify({...entry, score: 1})))).status, 400);
assert.equal((await handler(post(JSON.stringify({...entry, extra: "x".repeat(3000)})))).status, 400);
assert.equal(databaseCalls.length, 0);
assert.equal((await handler(new Request(endpoint))).status, 200);
assert.equal(databaseCalls[0].url.searchParams.get("limit"), "100");
assert.equal(databaseCalls[0].url.searchParams.get("order"), "score.desc,round.desc,level.desc,run_id.asc");
for (const code of [201, 200, 429, 503]) assert.equal((await handler(post(JSON.stringify(withSubclass)))).status, code);
const call = databaseCalls[1];
assert.equal(call.url.pathname, "/rest/v1/rpc/submit_global_ranking_score");
assert.equal(call.options.headers.Authorization, "Bearer server-test-key");
const submitted = JSON.parse(call.options.body);
assert.match(submitted.p_bucket, /^[a-f0-9]{64}$/);
assert.deepEqual(submitted.p_entry, withSubclass);
assert.match(databaseCalls[0].url.searchParams.get("select"),/character_subclass/);

const nodes = new Map(), saved = new Map(), events = {};
function element() {
  return {
    dataset: {version: "1.6.0"}, children: [],
    setAttribute(key, value) {this[key] = value},
    appendChild(child) {this.children.push(child)},
    replaceChildren() {this.children = []}
  };
}
const storage = {
  get length() {return saved.size},
  key: index => [...saved.keys()][index],
  getItem: key => saved.get(key),
  setItem: (key, value) => saved.set(key, value),
  removeItem: key => saved.delete(key)
};
let offline = true, attempts = [];
const context = vm.createContext({
  rankingClassName: id=>id,
  rankingSubclassName: id=>id==="berserk"?"Berserk":id??"—",
  $: id => {if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id)},
  document: {createElement: element},
  window: {addEventListener: (name, callback) => {events[name] = callback}},
  localStorage: storage,
  crypto: webcrypto, AbortSignal, Response,
  fetch: async (_url, options) => {
    if (options.method === "POST") attempts.push(JSON.parse(options.body));
    if (offline) throw new Error("offline");
    return options.method === "POST" ? Response.json({status: "created"}, {status: 201}) : Response.json([entry,withSubclass]);
  }
});
const run = code => vm.runInContext(code, context);
run(await readFile(new URL("../js/global-ranking.js", import.meta.url), "utf8"));
await run("flushGlobalScores()");
run('queueGlobalScore({name:"Crom", subclassId:"berserk", round:1, level:1, wins:0, uncommon:0, score:0})');
await run("flushGlobalScores()");
assert.equal(saved.size, 1);
await run("loadGlobalRanking(globalRankingView)");
assert.equal(nodes.get("globalRankingStatus").textContent, "Ranking globalny jest niedostępny.");
offline = false;
await events.online();
assert.equal(saved.size, 0);
assert.ok(attempts.length >= 2);
assert.ok(attempts.every(attempt => attempt.run_id === attempts[0].run_id));
assert.equal(attempts[0].character_subclass,"berserk");
await run("loadGlobalRanking(globalRankingView)");
assert.equal(nodes.get("globalRankingRows").children[0].children[1].textContent, entry.nickname);
assert.equal(nodes.get("globalRankingRows").children[0].children[3].textContent,"—");
assert.equal(nodes.get("globalRankingRows").children[1].children[3].textContent,"Berserk");
assert.equal(nodes.get("globalRankingTable").hidden, false);
run("selectRankingView(false)");
assert.equal(nodes.get("rankingPersonalPanel").hidden, false);
assert.equal(nodes.get("rankingGlobalPanel").hidden, true);
console.log("PASS: global ranking endpoint and offline client");
