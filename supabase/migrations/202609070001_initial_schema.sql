begin;

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;
grant execute on function public.set_updated_at() to authenticated;

create table public.athlete_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  age integer not null,
  sex text not null,
  weight_kg numeric(6, 2) not null,
  marathon_name text not null,
  marathon_date date not null,
  goal text not null,
  natural_pace_seconds integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint athlete_profiles_name_not_empty check (char_length(trim(name)) > 0),
  constraint athlete_profiles_age_range check (age between 1 and 120),
  constraint athlete_profiles_sex_allowed check (sex in ('male', 'female', 'other')),
  constraint athlete_profiles_weight_positive check (weight_kg > 0),
  constraint athlete_profiles_pace_positive check (natural_pace_seconds > 0)
);

create table public.training_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week integer not null,
  date date not null,
  session_type text not null,
  title text not null,
  planned_distance_km numeric(7, 2),
  target_pace_min_seconds integer,
  target_pace_max_seconds integer,
  target_rpe_min integer,
  target_rpe_max integer,
  estimated_duration_minutes integer,
  warmup text,
  main_workout text,
  cooldown text,
  strength text,
  nutrition text,
  recovery_notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_plan_items_identity_unique unique (user_id, date, title),
  constraint training_plan_items_owner_identity_unique unique (id, user_id),
  constraint training_plan_items_week_positive check (week > 0),
  constraint training_plan_items_title_not_empty check (char_length(trim(title)) > 0),
  constraint training_plan_items_session_type_allowed check (
    session_type in ('easy', 'long-run', 'tempo', 'intervals', 'gym', 'recovery', 'rest')
  ),
  constraint training_plan_items_distance_nonnegative check (
    planned_distance_km is null or planned_distance_km >= 0
  ),
  constraint training_plan_items_pace_min_positive check (
    target_pace_min_seconds is null or target_pace_min_seconds > 0
  ),
  constraint training_plan_items_pace_max_positive check (
    target_pace_max_seconds is null or target_pace_max_seconds > 0
  ),
  constraint training_plan_items_pace_order check (
    target_pace_min_seconds is null
    or target_pace_max_seconds is null
    or target_pace_min_seconds <= target_pace_max_seconds
  ),
  constraint training_plan_items_rpe_min_range check (
    target_rpe_min is null or target_rpe_min between 1 and 10
  ),
  constraint training_plan_items_rpe_max_range check (
    target_rpe_max is null or target_rpe_max between 1 and 10
  ),
  constraint training_plan_items_rpe_order check (
    target_rpe_min is null
    or target_rpe_max is null
    or target_rpe_min <= target_rpe_max
  ),
  constraint training_plan_items_duration_positive check (
    estimated_duration_minutes is null or estimated_duration_minutes > 0
  ),
  constraint training_plan_items_status_allowed check (
    status in ('pending', 'completed', 'modified', 'skipped')
  )
);

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  training_plan_item_id uuid,
  date date not null,
  distance_km numeric(7, 2) not null,
  duration_seconds integer not null,
  average_pace_seconds integer not null,
  rpe integer not null,
  pain integer not null,
  fatigue integer,
  sleep_hours numeric(4, 2),
  average_hr integer,
  max_hr integer,
  gi_symptoms text,
  food_before text,
  hydration text,
  gels text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_logs_plan_owner_fk
    foreign key (training_plan_item_id, user_id)
    references public.training_plan_items(id, user_id)
    on delete set null (training_plan_item_id),
  constraint workout_logs_distance_positive check (distance_km > 0),
  constraint workout_logs_duration_positive check (duration_seconds > 0),
  constraint workout_logs_pace_positive check (average_pace_seconds > 0),
  constraint workout_logs_rpe_range check (rpe between 1 and 10),
  constraint workout_logs_pain_range check (pain between 0 and 10),
  constraint workout_logs_fatigue_range check (fatigue is null or fatigue between 0 and 10),
  constraint workout_logs_sleep_range check (sleep_hours is null or sleep_hours between 0 and 24),
  constraint workout_logs_average_hr_range check (average_hr is null or average_hr between 30 and 250),
  constraint workout_logs_max_hr_range check (max_hr is null or max_hr between 30 and 260),
  constraint workout_logs_hr_order check (average_hr is null or max_hr is null or average_hr <= max_hr),
  constraint workout_logs_gi_allowed check (
    gi_symptoms is null or gi_symptoms in ('none', 'mild', 'moderate', 'severe')
  )
);

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  summary text not null,
  reason text not null,
  suggested_changes jsonb not null default '[]'::jsonb,
  warning text,
  applied boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_recommendations_status_allowed check (
    status in ('pending', 'ready', 'dismissed', 'error')
  )
);

create index training_plan_items_user_date_idx
  on public.training_plan_items (user_id, date);
create index training_plan_items_user_week_idx
  on public.training_plan_items (user_id, week);
create index training_plan_items_next_long_run_idx
  on public.training_plan_items (user_id, session_type, date);
create index workout_logs_user_date_idx
  on public.workout_logs (user_id, date desc);
create index workout_logs_plan_item_idx
  on public.workout_logs (training_plan_item_id)
  where training_plan_item_id is not null;
create index ai_recommendations_user_created_idx
  on public.ai_recommendations (user_id, created_at desc);

create trigger athlete_profiles_set_updated_at
before update on public.athlete_profiles
for each row execute function public.set_updated_at();

create trigger training_plan_items_set_updated_at
before update on public.training_plan_items
for each row execute function public.set_updated_at();

create trigger workout_logs_set_updated_at
before update on public.workout_logs
for each row execute function public.set_updated_at();

create trigger ai_recommendations_set_updated_at
before update on public.ai_recommendations
for each row execute function public.set_updated_at();

alter table public.athlete_profiles enable row level security;
alter table public.training_plan_items enable row level security;
alter table public.workout_logs enable row level security;
alter table public.ai_recommendations enable row level security;

create policy "athlete_profiles_select_own"
on public.athlete_profiles for select to authenticated
using ((select auth.uid()) = user_id);

create policy "athlete_profiles_insert_own"
on public.athlete_profiles for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "athlete_profiles_update_own"
on public.athlete_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "athlete_profiles_delete_own"
on public.athlete_profiles for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "training_plan_items_select_own"
on public.training_plan_items for select to authenticated
using ((select auth.uid()) = user_id);

create policy "training_plan_items_insert_own"
on public.training_plan_items for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "training_plan_items_update_own"
on public.training_plan_items for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "training_plan_items_delete_own"
on public.training_plan_items for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "workout_logs_select_own"
on public.workout_logs for select to authenticated
using ((select auth.uid()) = user_id);

create policy "workout_logs_insert_own"
on public.workout_logs for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "workout_logs_update_own"
on public.workout_logs for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "workout_logs_delete_own"
on public.workout_logs for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "ai_recommendations_select_own"
on public.ai_recommendations for select to authenticated
using ((select auth.uid()) = user_id);

create policy "ai_recommendations_insert_own"
on public.ai_recommendations for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "ai_recommendations_update_own"
on public.ai_recommendations for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "ai_recommendations_delete_own"
on public.ai_recommendations for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.athlete_profiles from anon;
revoke all on public.training_plan_items from anon;
revoke all on public.workout_logs from anon;
revoke all on public.ai_recommendations from anon;

grant select, insert, update, delete on public.athlete_profiles to authenticated;
grant select, insert, update, delete on public.training_plan_items to authenticated;
grant select, insert, update, delete on public.workout_logs to authenticated;
grant select, insert, update, delete on public.ai_recommendations to authenticated;

commit;
