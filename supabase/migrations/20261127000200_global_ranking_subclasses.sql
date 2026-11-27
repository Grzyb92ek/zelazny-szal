begin;

alter table public.global_ranking_scores
  drop constraint global_ranking_scores_character_class_check,
  add constraint global_ranking_scores_character_class_check
    check (character_class ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  add column character_subclass text
    check (character_subclass ~ '^[a-z0-9][a-z0-9_-]{0,63}$');

create or replace function public.submit_global_ranking_score(p_bucket text, p_entry jsonb)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_window timestamptz;
  current_run uuid := (p_entry->>'run_id')::uuid;
  bucket_count integer;
  inserted_id uuid;
begin
  if p_bucket is null or p_bucket !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid rate limit bucket';
  end if;

  -- Serialize reservations so a rejected client cannot consume the overall
  -- quota or create new buckets after it has been exhausted.
  perform pg_advisory_xact_lock(hashtext('iron-fury-global-ranking'));
  current_window := date_trunc('hour', clock_timestamp());
  if exists (
    select 1 from public.global_ranking_rate_limits
    where bucket = 'global' and window_start = current_window and requests >= 600
  ) then return 'rate_limited'; end if;

  insert into public.global_ranking_rate_limits as limits values (p_bucket, current_window, 1)
  on conflict (bucket) do update set window_start = excluded.window_start,
    requests = case when limits.window_start = excluded.window_start then limits.requests + 1 else 1 end
  where limits.window_start < excluded.window_start
    or (limits.window_start = excluded.window_start and limits.requests < 20)
  returning requests into bucket_count;
  if bucket_count is null then return 'rate_limited'; end if;

  -- The overall limit also applies if callers can rotate IP addresses.
  insert into public.global_ranking_rate_limits as limits values ('global', current_window, 1)
  on conflict (bucket) do update set window_start = excluded.window_start,
    requests = case when limits.window_start = excluded.window_start then limits.requests + 1 else 1 end
  where limits.window_start < excluded.window_start
    or (limits.window_start = excluded.window_start and limits.requests < 600)
  returning requests into bucket_count;
  if bucket_count is null then return 'rate_limited'; end if;

  delete from public.global_ranking_rate_limits where bucket in (
    select bucket from public.global_ranking_rate_limits
    where window_start < current_window - interval '24 hours'
    limit 100 for update skip locked
  );

  insert into public.global_ranking_scores
    (run_id, nickname, character_class, character_subclass, level, round, wins, uncommon, score, game_version, ended_at)
  values (current_run, p_entry->>'nickname', p_entry->>'character_class', p_entry->>'character_subclass', (p_entry->>'level')::integer,
    (p_entry->>'round')::integer, (p_entry->>'wins')::integer, (p_entry->>'uncommon')::integer,
    (p_entry->>'score')::integer, p_entry->>'game_version', (p_entry->>'ended_at')::timestamptz)
  on conflict (run_id) do nothing
  returning run_id into inserted_id;
  if inserted_id is null then return 'duplicate'; end if;
  return 'created';
end;
$$;

revoke all on function public.submit_global_ranking_score(text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_global_ranking_score(text, jsonb) to service_role;

commit;
