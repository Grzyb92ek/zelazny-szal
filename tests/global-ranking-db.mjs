import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {resolve} from "node:path";

const dependencyDir = process.argv[2];
if (!dependencyDir) throw Error("Pass the directory containing node_modules/@electric-sql/pglite");
const {PGlite} = createRequire(resolve(dependencyDir, "package.json"))("@electric-sql/pglite");
const db = await PGlite.create();
try {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  await db.exec(await readFile(new URL("../supabase/migrations/20261127000100_global_ranking.sql", import.meta.url), "utf8"));
  const select = "select * from public.global_ranking_scores";
  for (const role of ["anon", "authenticated"]) {
    await db.exec("set role " + role);
    await assert.rejects(db.exec(select), {code: "42501"});
    await assert.rejects(db.exec("insert into public.global_ranking_scores default values"), {code: "42501"});
    await assert.rejects(db.exec("update public.global_ranking_scores set score = 0"), {code: "42501"});
    await assert.rejects(db.exec("delete from public.global_ranking_scores"), {code: "42501"});
    await assert.rejects(db.exec("select public.submit_global_ranking_score('bad', '{}'::jsonb)"), {code: "42501"});
  }
  await db.exec("reset role");
  await db.exec("set role service_role");

  const example = {
    run_id: randomUUID(), nickname: "Crom", character_class: "barbarian",
    round: 3, level: 2, wins: 2, uncommon: 0, score: 250,
    game_version: "1.6.0", ended_at: "2026-01-01T00:00:00.000Z"
  };
  const submit = async (entry, bucket = "a".repeat(64)) =>
    (await db.query("select public.submit_global_ranking_score($1, $2) as outcome", [bucket, entry])).rows[0].outcome;

  assert.equal(await submit(example), "created");
  await db.exec("reset role");
  await db.exec(await readFile(new URL("../supabase/migrations/20261127000200_global_ranking_subclasses.sql", import.meta.url), "utf8"));
  await db.exec("set role service_role");
  assert.equal(await submit({...example, nickname: "new name"}), "duplicate");
  assert.equal((await db.exec(select))[0].rows[0].nickname, "Crom");
  assert.equal((await db.exec(select))[0].rows[0].character_subclass,null);
  await assert.rejects(submit({...example, run_id: randomUUID(), score: 251}), {code: "23514"});
  assert.equal(await submit({...example, run_id: randomUUID(), nickname: "One", level: 1, uncommon: 2}), "created");
  assert.equal(await submit({...example, run_id: randomUUID(), nickname: "Two", round: 2, wins: 1, level: 4}), "created");
  assert.equal(await submit({...example, run_id: randomUUID(), nickname: "Top", character_subclass:"berserk",round: 4, wins: 3, score: 350}), "created");
  const ordered = await db.exec(select + " order by score desc, round desc, level desc, run_id asc limit 100");
  assert.deepEqual(ordered[0].rows.map(row => row.nickname), ["Top", "Crom", "One", "Two"]);
  assert.equal(ordered[0].rows[0].character_subclass,"berserk");

  for (let i = 5; i < 20; i++) assert.equal(await submit(example), "duplicate");
  assert.equal(await submit({...example, run_id: randomUUID()}), "rate_limited");
  assert.equal(await submit(example, "b".repeat(64)), "duplicate");
  await db.exec("update public.global_ranking_rate_limits set requests = 600 where bucket = 'global'");
  assert.equal(await submit({...example, run_id: randomUUID()}, "c".repeat(64)), "rate_limited");
  await db.exec("update public.global_ranking_rate_limits set window_start = now() - interval '25 hours'");
  assert.equal(await submit({...example, run_id: randomUUID()}), "created");
  assert.equal((await db.exec("select * from public.global_ranking_rate_limits"))[0].rows.length, 2);
  console.log("PASS: PostgreSQL migration, RLS and grants, score constraints, sorting, deduplication, rate limits");
} finally {
  await db.close();
}
