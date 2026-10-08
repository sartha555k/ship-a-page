-- No user accounts required. Browser roles cannot read or write these tables.
begin;
create schema if not exists backend_private;
revoke all on schema backend_private from public, anon, authenticated;
create table backend_private.request_buckets (
  bucket_key text not null,
  window_start timestamptz not null,
  requests integer not null default 0 check (requests >= 0),
  primary key (bucket_key, window_start)
);
alter table backend_private.request_buckets enable row level security;
revoke all on backend_private.request_buckets from public, anon, authenticated;

create table public.experiment_runs (
  id uuid primary key default gen_random_uuid(),
  experiment_slug text not null check (experiment_slug ~ '^[a-z0-9-]{1,64}$'),
  status text not null default 'completed' check (status in ('completed', 'failed')),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index experiment_runs_slug_created_idx on public.experiment_runs (experiment_slug, created_at desc);
alter table public.experiment_runs enable row level security;
revoke all on public.experiment_runs from public, anon, authenticated;
grant select, insert, update, delete on public.experiment_runs to service_role;

-- One transaction atomically reserves a per-client minute slot AND a site-wide daily slot.
-- The service-only function prevents visitors from changing limits or exhausting quotas directly.
create function public.reserve_experiment_request(p_experiment text, p_client_hash text, p_per_minute integer, p_daily integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  moment timestamptz := clock_timestamp();
  minute_start timestamptz := date_trunc('minute', moment);
  day_start timestamptz := date_trunc('day', moment at time zone 'UTC') at time zone 'UTC';
  client_key text := 'client:' || p_client_hash;
  minute_count integer;
  daily_count integer;
begin
  if p_experiment is null or p_client_hash is null or p_per_minute is null or p_daily is null
    or p_experiment !~ '^[a-z0-9-]{1,64}$' or p_client_hash !~ '^[a-f0-9]{64}$'
    or p_per_minute not between 1 and 100 or p_daily not between 1 and 10000 then
    raise exception 'Invalid quota parameters';
  end if;
  -- Shared lock coordinates all experiment routes and all Vercel instances.
  perform pg_advisory_xact_lock(731204981);
  delete from backend_private.request_buckets where window_start < day_start;
  select requests into minute_count from backend_private.request_buckets where bucket_key = client_key and window_start = minute_start;
  select requests into daily_count from backend_private.request_buckets where bucket_key = 'site:daily' and window_start = day_start;
  if coalesce(daily_count, 0) >= p_daily then
    return jsonb_build_object('allowed', false, 'retry_after', ceil(extract(epoch from day_start + interval '1 day' - moment)));
  end if;
  if coalesce(minute_count, 0) >= p_per_minute then
    return jsonb_build_object('allowed', false, 'retry_after', ceil(extract(epoch from minute_start + interval '1 minute' - moment)));
  end if;
  insert into backend_private.request_buckets (bucket_key, window_start, requests)
    values (client_key, minute_start, 1), ('site:daily', day_start, 1)
    on conflict (bucket_key, window_start) do update set requests = backend_private.request_buckets.requests + 1;
  return jsonb_build_object('allowed', true, 'retry_after', 0);
end;
$$;
revoke execute on function public.reserve_experiment_request(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.reserve_experiment_request(text, text, integer, integer) to service_role;
commit;
