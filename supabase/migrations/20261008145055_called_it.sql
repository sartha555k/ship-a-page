-- Called It: public reads, X-authenticated writes, immutable published calls.
begin;
create schema if not exists called_it_private;
revoke all on schema called_it_private from public;
grant usage on schema called_it_private to authenticated;
create table called_it_private.reviewers (user_id uuid primary key references auth.users(id) on delete cascade);
revoke all on called_it_private.reviewers from public, anon, authenticated;

create function called_it_private.has_x_identity() returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists (select 1 from auth.identities where user_id = auth.uid() and provider = 'x');
$$;
create function called_it_private.is_reviewer() returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists (select 1 from called_it_private.reviewers where user_id = auth.uid());
$$;
revoke all on function called_it_private.has_x_identity(), called_it_private.is_reviewer() from public;
grant execute on function called_it_private.has_x_identity(), called_it_private.is_reviewer() to authenticated;
create function public.called_it_is_admin() returns boolean language sql stable security invoker set search_path = '' as $$ select called_it_private.is_reviewer(); $$;
revoke all on function public.called_it_is_admin() from public;
grant execute on function public.called_it_is_admin() to authenticated;

create table public.called_it_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 1 and 100),
 handle text check (char_length(handle) <= 100), avatar_url text
);
alter table public.called_it_profiles enable row level security;
grant select on public.called_it_profiles to anon, authenticated;
revoke insert, update, delete on public.called_it_profiles from anon, authenticated;
create policy profiles_public_read on public.called_it_profiles for select to anon, authenticated using (true);

-- Display metadata is cosmetic, never used for authorization or a verified badge.
create function called_it_private.sync_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.called_it_profiles(id,display_name,handle,avatar_url) values (
 new.id, left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''),nullif(new.raw_user_meta_data->>'name',''),'Member'),100),
 left(coalesce(new.raw_user_meta_data->>'preferred_username',new.raw_user_meta_data->>'user_name'),100), new.raw_user_meta_data->>'avatar_url'
 ) on conflict(id) do update set display_name=excluded.display_name,handle=excluded.handle,avatar_url=excluded.avatar_url;
 return new;
end; $$;
revoke all on function called_it_private.sync_profile() from public, anon, authenticated;
create trigger called_it_profile_sync after insert or update of raw_user_meta_data on auth.users for each row execute function called_it_private.sync_profile();
insert into public.called_it_profiles(id,display_name,handle,avatar_url)
 select id,left(coalesce(nullif(raw_user_meta_data->>'full_name',''),nullif(raw_user_meta_data->>'name',''),'Member'),100),left(coalesce(raw_user_meta_data->>'preferred_username',raw_user_meta_data->>'user_name'),100),raw_user_meta_data->>'avatar_url' from auth.users on conflict(id) do nothing;

create table public.called_it_predictions (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references public.called_it_profiles(id) on delete cascade,
 claim text not null check(char_length(btrim(claim)) between 15 and 280),
 reasoning text not null check(char_length(btrim(reasoning)) between 20 and 2000),
 criteria text not null check(char_length(btrim(criteria)) between 20 and 1000),
 source_url text not null check(char_length(source_url) <= 2048 and source_url ~ '^https://[^[:space:]@]+'),
 deadline timestamptz not null, created_at timestamptz not null default now(),
 status text not null default 'open' check(status in ('open','called','missed','unresolved')),
 resolution_note text, evidence_url text, resolved_at timestamptz,
 check(deadline >= created_at + interval '1 hour' and deadline <= created_at + interval '366 days'),
 check((status='open' and resolution_note is null and evidence_url is null and resolved_at is null) or
 (status <> 'open' and resolution_note is not null and evidence_url is not null and char_length(btrim(resolution_note)) between 20 and 2000 and char_length(evidence_url) <= 2048 and evidence_url ~ '^https://[^[:space:]@]+' and resolved_at is not null))
);
create index called_it_predictions_created on public.called_it_predictions(created_at desc);
create index called_it_predictions_author_created on public.called_it_predictions(author_id,created_at desc);
create index called_it_predictions_deadline on public.called_it_predictions(deadline) where status='open';
alter table public.called_it_predictions enable row level security;
grant select on public.called_it_predictions to anon,authenticated;
revoke all on public.called_it_predictions from anon,authenticated;
grant select on public.called_it_predictions to anon,authenticated;
grant insert(author_id,claim,reasoning,criteria,source_url,deadline) on public.called_it_predictions to authenticated;
grant update(status,resolution_note,evidence_url,resolved_at) on public.called_it_predictions to authenticated;
create policy calls_public_read on public.called_it_predictions for select to anon,authenticated using(true);
create policy calls_own_insert on public.called_it_predictions for insert to authenticated with check(author_id=(select auth.uid()) and (select called_it_private.has_x_identity()));
create policy calls_reviewer_update on public.called_it_predictions for update to authenticated using((select called_it_private.is_reviewer())) with check((select called_it_private.is_reviewer()));

create function called_it_private.guard_prediction() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 if TG_OP='INSERT' then
  perform pg_advisory_xact_lock(hashtextextended(new.author_id::text,0));
  if (select count(*) from public.called_it_predictions where author_id=new.author_id and created_at > now()-interval '24 hours') >= 5 then raise exception 'daily limit reached'; end if;
  new.created_at := now();
  new.status := 'open'; new.resolution_note := null; new.evidence_url := null; new.resolved_at := null;
 else
  perform pg_advisory_xact_lock(hashtextextended(old.id::text,2));
  if row(new.id,new.author_id,new.claim,new.reasoning,new.criteria,new.source_url,new.deadline,new.created_at) is distinct from row(old.id,old.author_id,old.claim,old.reasoning,old.criteria,old.source_url,old.deadline,old.created_at) then raise exception 'Original calls are immutable'; end if;
  if old.status <> 'open' or old.deadline > now() or new.status='open' then raise exception 'Call is not ready for resolution'; end if;
  new.resolved_at := now();
 end if;
 return new;
end; $$;
revoke all on function called_it_private.guard_prediction() from public,anon,authenticated;
create trigger called_it_guard_prediction before insert or update on public.called_it_predictions for each row execute function called_it_private.guard_prediction();

create table public.called_it_responses (
 id uuid primary key default gen_random_uuid(), prediction_id uuid not null references public.called_it_predictions(id) on delete cascade,
 user_id uuid not null references public.called_it_profiles(id) on delete cascade,
 stance text not null check(stance in ('back','challenge')),
 argument text not null check(char_length(btrim(argument)) between 10 and 1200),
 created_at timestamptz not null default now(), unique(prediction_id,user_id)
);
create index called_it_responses_user_created on public.called_it_responses(user_id,created_at desc);
alter table public.called_it_responses enable row level security;
revoke all on public.called_it_responses from anon,authenticated;
grant select on public.called_it_responses to anon,authenticated;
grant insert(prediction_id,user_id,stance,argument) on public.called_it_responses to authenticated;
create policy responses_public_read on public.called_it_responses for select to anon,authenticated using(true);
create policy responses_own_insert on public.called_it_responses for insert to authenticated with check(user_id=(select auth.uid()) and (select called_it_private.has_x_identity()));
create function called_it_private.guard_response() returns trigger language plpgsql security invoker set search_path = '' as $$
declare call public.called_it_predictions;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.prediction_id::text,2));
 select * into call from public.called_it_predictions where id=new.prediction_id;
 if not found or call.status<>'open' or call.deadline<=now() then raise exception 'Call is closed'; end if;
 if call.author_id=new.user_id then raise exception 'You cannot respond to your own call'; end if;
 perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,1));
 if (select count(*) from public.called_it_responses where user_id=new.user_id and created_at>now()-interval '24 hours') >= 30 then raise exception 'daily limit reached'; end if;
 new.created_at:=now(); return new;
end; $$;
revoke all on function called_it_private.guard_response() from public,anon,authenticated;
create trigger called_it_guard_response before insert on public.called_it_responses for each row execute function called_it_private.guard_response();

-- Invoker view preserves the underlying tables' RLS.
create view public.called_it_feed with(security_invoker=true) as
 select p.*, jsonb_build_object('id',a.id,'display_name',a.display_name,'handle',a.handle,'avatar_url',a.avatar_url) as author,
 (select count(*) from public.called_it_responses r where r.prediction_id=p.id and r.stance='back') as back_count,
 (select count(*) from public.called_it_responses r where r.prediction_id=p.id and r.stance='challenge') as challenge_count
 from public.called_it_predictions p join public.called_it_profiles a on a.id=p.author_id;
grant select on public.called_it_feed to anon,authenticated;
commit;
