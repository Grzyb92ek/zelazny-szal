import { createRankingHandler } from "./handler.mjs";

const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
Deno.serve(createRankingHandler({
  projectUrl: Deno.env.get("SUPABASE_URL"),
  serviceKey: secretKeys.default ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  rateSecret: Deno.env.get("RANKING_RATE_SECRET")
}));
