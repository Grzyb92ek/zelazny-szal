begin;

create table public.global_ranking_scores (
  run_id uuid primary key,
  nickname text not null check (
    char_length(nickname) between 1 and 24
    and nickname = btrim(nickname)
    and nickname !~ '[[:cntrl:]]'
  ),
  character_class text not null check (character_class = 'barbarian'),
  level integer not null check (level between 1 and 10000),
  round integer not null check (round between 1 and 10000),
  wins integer not null check (wins = round - 1),
  uncommon integer not null check (uncommon between 0 and 6),
  score integer not null check (score = 100 * wins + 50 * (level - 1) + 25 * uncommon),
  ended_at timestamptz not null,
  game_version text not null check (game_version ~ '^[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}$')
);

create index global_ranking_order on public.global_ranking_scores
  (score desc, round desc, level desc, run_id);

create table public.global_ranking_rate_limits (
  bucket text primary key,
  window_start timestamptz not null,
  requests integer not null check (requests > 0)
);
create index global_ranking_rate_window on public.global_ranking_rate_limits (window_start);

alter table public.global_ranking_scores enable row level security;
alter table public.global_ranking_rate_limits enable row level security;

-- Both tables are accessed only through the server. No client RLS policies.
revoke all on public.global_ranking_scores, public.global_ranking_rate_limits
  from public, anon, authenticated;
grant select, insert on public.global_ranking_scores to service_role;
grant select, insert, update, delete on public.global_ranking_rate_limits to service_role;

create function public.submit_global_ranking_score(p_bucket text, p_entry jsonb)
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
    (run_id, nickname, character_class, level, round, wins, uncommon, score, game_version, ended_at)
  values (current_run, p_entry->>'nickname', p_entry->>'character_class', (p_entry->>'level')::integer,
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
