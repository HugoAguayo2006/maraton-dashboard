begin;

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nueva conversación',
  context_type text not null default 'global',
  context_ref_id text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_conversations_owner_identity_unique unique (id, user_id),
  constraint ai_conversations_title_not_empty check (char_length(trim(title)) > 0),
  constraint ai_conversations_context_allowed check (
    context_type in ('global', 'dashboard', 'plan', 'workout', 'progress', 'guide')
  )
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_messages_conversation_owner_fk
    foreign key (conversation_id, user_id)
    references public.ai_conversations(id, user_id)
    on delete cascade,
  constraint ai_messages_role_allowed check (role in ('user', 'assistant')),
  constraint ai_messages_content_not_empty check (char_length(trim(content)) > 0),
  constraint ai_messages_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.ai_plan_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid,
  kind text not null default 'session_change',
  status text not null default 'proposed',
  reason text not null,
  summary text not null,
  previous_plan_data jsonb not null default '[]'::jsonb,
  new_plan_data jsonb not null default '[]'::jsonb,
  user_confirmed boolean not null default false,
  confirmed_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ai_plan_changes_conversation_owner_fk
    foreign key (conversation_id, user_id)
    references public.ai_conversations(id, user_id)
    on delete set null (conversation_id),
  constraint ai_plan_changes_kind_allowed check (kind in ('session_change', 'plan_generation')),
  constraint ai_plan_changes_status_allowed check (status in ('proposed', 'applied', 'rejected', 'expired')),
  constraint ai_plan_changes_reason_not_empty check (char_length(trim(reason)) > 0),
  constraint ai_plan_changes_summary_not_empty check (char_length(trim(summary)) > 0),
  constraint ai_plan_changes_previous_array check (jsonb_typeof(previous_plan_data) = 'array'),
  constraint ai_plan_changes_new_array check (jsonb_typeof(new_plan_data) = 'array')
);

create table public.training_plan_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null,
  source text not null default 'bolt_ai',
  summary text not null,
  generation_reason text,
  plan_data jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint training_plan_versions_user_version_unique unique (user_id, version),
  constraint training_plan_versions_version_positive check (version > 0),
  constraint training_plan_versions_source_allowed check (source in ('existing', 'bolt_ai')),
  constraint training_plan_versions_summary_not_empty check (char_length(trim(summary)) > 0),
  constraint training_plan_versions_plan_array check (jsonb_typeof(plan_data) = 'array')
);

create unique index training_plan_versions_one_active_idx
  on public.training_plan_versions (user_id)
  where is_active;

create table public.athlete_ai_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  experience_level text,
  running_days smallint[] not null default '{}'::smallint[],
  strength_days smallint[] not null default '{}'::smallint[],
  preferred_long_run_day smallint,
  current_weekly_km numeric(7, 2),
  longest_recent_run_km numeric(7, 2),
  time_constraints text,
  training_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint athlete_ai_preferences_experience_allowed check (
    experience_level is null or experience_level in ('beginner', 'intermediate', 'advanced')
  ),
  constraint athlete_ai_preferences_running_days_valid check (
    running_days <@ array[1,2,3,4,5,6,7]::smallint[]
  ),
  constraint athlete_ai_preferences_strength_days_valid check (
    strength_days <@ array[1,2,3,4,5,6,7]::smallint[]
  ),
  constraint athlete_ai_preferences_long_day_valid check (
    preferred_long_run_day is null or preferred_long_run_day between 1 and 7
  ),
  constraint athlete_ai_preferences_weekly_km_valid check (
    current_weekly_km is null or current_weekly_km >= 0
  ),
  constraint athlete_ai_preferences_longest_run_valid check (
    longest_recent_run_km is null or longest_recent_run_km >= 0
  )
);

create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null default gen_random_uuid(),
  operation text not null,
  success boolean not null default false,
  duration_ms integer,
  token_estimate integer,
  created_at timestamptz not null default now(),
  constraint ai_usage_events_operation_allowed check (
    operation in ('chat', 'plan_generation', 'progress_analysis', 'plan_change')
  ),
  constraint ai_usage_events_duration_valid check (duration_ms is null or duration_ms >= 0),
  constraint ai_usage_events_tokens_valid check (token_estimate is null or token_estimate >= 0)
);

create index ai_conversations_user_updated_idx
  on public.ai_conversations (user_id, updated_at desc);
create index ai_messages_conversation_created_idx
  on public.ai_messages (conversation_id, created_at);
create index ai_messages_user_created_idx
  on public.ai_messages (user_id, created_at desc);
create index ai_plan_changes_user_created_idx
  on public.ai_plan_changes (user_id, created_at desc);
create index training_plan_versions_user_created_idx
  on public.training_plan_versions (user_id, created_at desc);
create index ai_usage_events_rate_limit_idx
  on public.ai_usage_events (user_id, operation, created_at desc);

create trigger ai_conversations_set_updated_at
before update on public.ai_conversations
for each row execute function public.set_updated_at();

create trigger athlete_ai_preferences_set_updated_at
before update on public.athlete_ai_preferences
for each row execute function public.set_updated_at();

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_plan_changes enable row level security;
alter table public.training_plan_versions enable row level security;
alter table public.athlete_ai_preferences enable row level security;
alter table public.ai_usage_events enable row level security;

create policy "ai_conversations_select_own" on public.ai_conversations
for select to authenticated using ((select auth.uid()) = user_id);
create policy "ai_conversations_insert_own" on public.ai_conversations
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ai_conversations_update_own" on public.ai_conversations
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "ai_conversations_delete_own" on public.ai_conversations
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "ai_messages_select_own" on public.ai_messages
for select to authenticated using ((select auth.uid()) = user_id);
create policy "ai_messages_insert_own" on public.ai_messages
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ai_messages_update_own" on public.ai_messages
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "ai_messages_delete_own" on public.ai_messages
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "ai_plan_changes_select_own" on public.ai_plan_changes
for select to authenticated using ((select auth.uid()) = user_id);
create policy "ai_plan_changes_insert_own" on public.ai_plan_changes
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ai_plan_changes_update_own" on public.ai_plan_changes
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "ai_plan_changes_delete_own" on public.ai_plan_changes
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "training_plan_versions_select_own" on public.training_plan_versions
for select to authenticated using ((select auth.uid()) = user_id);
create policy "training_plan_versions_insert_own" on public.training_plan_versions
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "training_plan_versions_update_own" on public.training_plan_versions
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "training_plan_versions_delete_own" on public.training_plan_versions
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "athlete_ai_preferences_select_own" on public.athlete_ai_preferences
for select to authenticated using ((select auth.uid()) = user_id);
create policy "athlete_ai_preferences_insert_own" on public.athlete_ai_preferences
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "athlete_ai_preferences_update_own" on public.athlete_ai_preferences
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "athlete_ai_preferences_delete_own" on public.athlete_ai_preferences
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "ai_usage_events_select_own" on public.ai_usage_events
for select to authenticated using ((select auth.uid()) = user_id);
create policy "ai_usage_events_insert_own" on public.ai_usage_events
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ai_usage_events_update_own" on public.ai_usage_events
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "ai_usage_events_delete_own" on public.ai_usage_events
for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.ai_conversations from anon;
revoke all on public.ai_messages from anon;
revoke all on public.ai_plan_changes from anon;
revoke all on public.training_plan_versions from anon;
revoke all on public.athlete_ai_preferences from anon;
revoke all on public.ai_usage_events from anon;

grant select, insert, update, delete on public.ai_conversations to authenticated;
grant select, insert, update, delete on public.ai_messages to authenticated;
grant select, insert, update, delete on public.ai_plan_changes to authenticated;
grant select, insert, update, delete on public.training_plan_versions to authenticated;
grant select, insert, update, delete on public.athlete_ai_preferences to authenticated;
grant select, insert, update, delete on public.ai_usage_events to authenticated;

create or replace function public.apply_bolt_plan_change(
  p_change_id uuid,
  p_confirm boolean
)
returns integer
language plpgsql
security invoker
set search_path = 'public', 'pg_temp'
as $$
declare
  proposal public.ai_plan_changes%rowtype;
  entry jsonb;
  session_data jsonb;
  target_id uuid;
  affected integer;
  next_version integer;
  plan_snapshot jsonb;
begin
  if p_confirm is not true then
    raise exception 'Explicit confirmation is required';
  end if;

  select * into proposal
  from public.ai_plan_changes
  where id = p_change_id
    and user_id = (select auth.uid())
    and status = 'proposed'
  for update;

  if proposal.id is null then
    raise exception 'Plan change is unavailable';
  end if;

  if not exists (
    select 1 from public.training_plan_versions
    where user_id = proposal.user_id
  ) then
    select coalesce(jsonb_agg(to_jsonb(plan_row) order by plan_row.date), '[]'::jsonb)
    into plan_snapshot
    from (
      select week, date, session_type, effort_type, title, planned_distance_km,
        target_pace_text, target_rpe_text, estimated_duration_minutes, warmup,
        main_workout, cooldown, strength, nutrition, recovery_notes, status
      from public.training_plan_items
      where user_id = proposal.user_id
    ) as plan_row;

    insert into public.training_plan_versions (
      user_id, version, source, summary, generation_reason, plan_data, is_active
    ) values (
      proposal.user_id, 1, 'existing', 'Plan anterior a Bolt AI',
      'Instantánea automática previa al primer cambio', plan_snapshot, false
    );
  end if;

  if proposal.kind = 'plan_generation' then
    delete from public.training_plan_items
    where user_id = proposal.user_id
      and date >= (proposal.created_at at time zone 'America/Mexico_City')::date
      and status <> 'completed';
  end if;

  for entry in select value from jsonb_array_elements(proposal.new_plan_data)
  loop
    session_data := entry -> 'session';
    if session_data is null or jsonb_typeof(session_data) <> 'object' then
      raise exception 'Invalid plan session payload';
    end if;
    if entry ->> 'action' = 'skip' then
      target_id := nullif(entry ->> 'targetId', '')::uuid;
      update public.training_plan_items
      set status = 'skipped',
          source_data = coalesce(source_data, '{}'::jsonb)
            || jsonb_build_object('bolt_ai_change_id', proposal.id)
      where id = target_id
        and user_id = proposal.user_id
        and status <> 'completed';
      get diagnostics affected = row_count;
      if affected <> 1 then raise exception 'Target plan session is unavailable'; end if;
    elsif entry ->> 'action' = 'update' then
      target_id := nullif(entry ->> 'targetId', '')::uuid;
      update public.training_plan_items
      set week = (session_data ->> 'week')::integer,
          date = (session_data ->> 'date')::date,
          session_type = session_data ->> 'sessionType',
          effort_type = nullif(session_data ->> 'effortType', ''),
          title = session_data ->> 'title',
          planned_distance_km = nullif(session_data ->> 'distanceKm', '')::numeric,
          target_pace_text = nullif(session_data ->> 'targetPaceText', ''),
          target_rpe_text = nullif(session_data ->> 'targetRpeText', ''),
          estimated_duration_minutes = nullif(session_data ->> 'estimatedDurationMin', '')::integer,
          warmup = nullif(session_data ->> 'warmup', ''),
          main_workout = nullif(session_data ->> 'mainWorkout', ''),
          cooldown = nullif(session_data ->> 'cooldown', ''),
          strength = nullif(session_data ->> 'strength', ''),
          nutrition = nullif(session_data ->> 'nutrition', ''),
          recovery_notes = nullif(session_data ->> 'recoveryNotes', ''),
          status = 'modified',
          source_data = coalesce(source_data, '{}'::jsonb)
            || jsonb_build_object('bolt_ai_change_id', proposal.id)
      where id = target_id
        and user_id = proposal.user_id
        and status <> 'completed';
      get diagnostics affected = row_count;
      if affected <> 1 then raise exception 'Target plan session is unavailable'; end if;
    elsif entry ->> 'action' = 'add' then
      insert into public.training_plan_items (
        user_id, week, date, session_type, effort_type, title,
        planned_distance_km, target_pace_text, target_rpe_text,
        estimated_duration_minutes, warmup, main_workout, cooldown,
        strength, nutrition, recovery_notes, status, source_data
      ) values (
        proposal.user_id,
        (session_data ->> 'week')::integer,
        (session_data ->> 'date')::date,
        session_data ->> 'sessionType',
        nullif(session_data ->> 'effortType', ''),
        session_data ->> 'title',
        nullif(session_data ->> 'distanceKm', '')::numeric,
        nullif(session_data ->> 'targetPaceText', ''),
        nullif(session_data ->> 'targetRpeText', ''),
        nullif(session_data ->> 'estimatedDurationMin', '')::integer,
        nullif(session_data ->> 'warmup', ''),
        nullif(session_data ->> 'mainWorkout', ''),
        nullif(session_data ->> 'cooldown', ''),
        nullif(session_data ->> 'strength', ''),
        nullif(session_data ->> 'nutrition', ''),
        nullif(session_data ->> 'recoveryNotes', ''),
        'pending',
        jsonb_build_object('source', 'bolt_ai', 'bolt_ai_change_id', proposal.id)
      );
    else
      raise exception 'Unsupported plan change action';
    end if;
  end loop;

  update public.training_plan_versions
  set is_active = false
  where user_id = proposal.user_id and is_active;

  select coalesce(max(version), 0) + 1 into next_version
  from public.training_plan_versions
  where user_id = proposal.user_id;

  select coalesce(jsonb_agg(to_jsonb(plan_row) order by plan_row.date), '[]'::jsonb)
  into plan_snapshot
  from (
    select week, date, session_type, effort_type, title, planned_distance_km,
      target_pace_text, target_rpe_text, estimated_duration_minutes, warmup,
      main_workout, cooldown, strength, nutrition, recovery_notes, status
    from public.training_plan_items
    where user_id = proposal.user_id
  ) as plan_row;

  insert into public.training_plan_versions (
    user_id, version, source, summary, generation_reason, plan_data, is_active
  ) values (
    proposal.user_id, next_version, 'bolt_ai', proposal.summary,
    proposal.reason, plan_snapshot, true
  );

  update public.ai_plan_changes
  set status = 'applied',
      user_confirmed = true,
      confirmed_at = now(),
      applied_at = now()
  where id = proposal.id and user_id = proposal.user_id;

  return next_version;
end;
$$;

revoke all on function public.apply_bolt_plan_change(uuid, boolean) from public;
revoke all on function public.apply_bolt_plan_change(uuid, boolean) from anon;
grant execute on function public.apply_bolt_plan_change(uuid, boolean) to authenticated;

commit;
