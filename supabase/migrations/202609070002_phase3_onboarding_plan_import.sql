begin;

alter table public.athlete_profiles
  add column date_of_birth date;

alter table public.athlete_profiles
  drop constraint athlete_profiles_sex_allowed;

update public.athlete_profiles
set sex = 'prefer_not_to_say'
where sex = 'other';

alter table public.athlete_profiles
  add constraint athlete_profiles_sex_allowed
  check (sex in ('male', 'female', 'prefer_not_to_say'));

alter table public.athlete_profiles
  add constraint athlete_profiles_date_of_birth_not_future
  check (date_of_birth is null or date_of_birth <= current_date);

alter table public.training_plan_items
  add column effort_type text,
  add column target_pace_text text,
  add column target_rpe_text text,
  add column source_row_number integer,
  add column source_data jsonb not null default '{}'::jsonb;

alter table public.training_plan_items
  drop constraint training_plan_items_session_type_allowed,
  drop constraint training_plan_items_rpe_min_range,
  drop constraint training_plan_items_rpe_max_range;

alter table public.training_plan_items
  add constraint training_plan_items_session_type_allowed check (
    session_type in (
      'easy',
      'long-run',
      'tempo',
      'intervals',
      'gym',
      'strength',
      'recovery',
      'rest'
    )
  ),
  add constraint training_plan_items_effort_type_allowed check (
    effort_type is null
    or effort_type in (
      'recovery',
      'easy',
      'steady_moderate',
      'tempo_threshold',
      'intervals_speed',
      'long_run',
      'rest'
    )
  ),
  add constraint training_plan_items_rpe_min_range check (
    target_rpe_min is null or target_rpe_min between 0 and 10
  ),
  add constraint training_plan_items_rpe_max_range check (
    target_rpe_max is null or target_rpe_max between 0 and 10
  ),
  add constraint training_plan_items_source_row_positive check (
    source_row_number is null or source_row_number > 1
  );

create index training_plan_items_next_effort_long_run_idx
  on public.training_plan_items (user_id, effort_type, date)
  where effort_type = 'long_run';

create table public.training_plan_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_name text not null,
  source_sha256 text not null,
  sheet_names jsonb not null default '[]'::jsonb,
  workbook_snapshot jsonb not null default '{}'::jsonb,
  imported_row_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_plan_imports_owner_source_unique unique (user_id, source_name),
  constraint training_plan_imports_source_name_not_empty
    check (char_length(trim(source_name)) > 0),
  constraint training_plan_imports_sha256_format
    check (source_sha256 ~ '^[a-f0-9]{64}$'),
  constraint training_plan_imports_row_count_nonnegative
    check (imported_row_count >= 0)
);

create index training_plan_imports_user_updated_idx
  on public.training_plan_imports (user_id, updated_at desc);

create trigger training_plan_imports_set_updated_at
before update on public.training_plan_imports
for each row execute function public.set_updated_at();

alter table public.training_plan_imports enable row level security;

create policy "training_plan_imports_select_own"
on public.training_plan_imports for select to authenticated
using ((select auth.uid()) = user_id);

create policy "training_plan_imports_insert_own"
on public.training_plan_imports for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "training_plan_imports_update_own"
on public.training_plan_imports for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "training_plan_imports_delete_own"
on public.training_plan_imports for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.training_plan_imports from anon;
grant select, insert, update, delete on public.training_plan_imports to authenticated;

create or replace function public.handle_new_athlete_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  profile_date_of_birth date;
  profile_weight_kg numeric(6, 2);
  profile_sex text;
begin
  profile_name := nullif(trim(new.raw_user_meta_data ->> 'name'), '');
  profile_sex := nullif(trim(new.raw_user_meta_data ->> 'sex'), '');

  begin
    profile_date_of_birth := nullif(
      trim(new.raw_user_meta_data ->> 'date_of_birth'),
      ''
    )::date;
    profile_weight_kg := nullif(
      trim(new.raw_user_meta_data ->> 'weight_kg'),
      ''
    )::numeric(6, 2);
  exception
    when others then
      return new;
  end;

  if profile_name is null
    or profile_date_of_birth is null
    or profile_date_of_birth > current_date
    or profile_weight_kg is null
    or profile_weight_kg <= 0
    or profile_sex not in ('male', 'female', 'prefer_not_to_say')
  then
    return new;
  end if;

  insert into public.athlete_profiles (
    user_id,
    name,
    age,
    date_of_birth,
    sex,
    weight_kg,
    marathon_name,
    marathon_date,
    goal,
    natural_pace_seconds
  ) values (
    new.id,
    profile_name,
    date_part('year', age(current_date, profile_date_of_birth))::integer,
    profile_date_of_birth,
    profile_sex,
    profile_weight_kg,
    'Maratón de Guadalajara',
    date '2026-11-08',
    'Terminar bien y sin lesiones',
    360
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_athlete_profile() from public;

drop trigger if exists on_auth_user_created_create_athlete_profile on auth.users;

create trigger on_auth_user_created_create_athlete_profile
after insert on auth.users
for each row execute function public.handle_new_athlete_profile();

commit;
