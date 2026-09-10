begin;

alter table public.athlete_profiles
  add column avatar_url text,
  add column goal_event_name text,
  add column goal_event_distance_km numeric(7, 3),
  add column goal_event_date date,
  add column goal_event_location text,
  add column goal_event_objective text;

update public.athlete_profiles
set
  goal_event_name = coalesce(goal_event_name, marathon_name),
  goal_event_distance_km = coalesce(goal_event_distance_km, 42.195),
  goal_event_date = coalesce(goal_event_date, marathon_date),
  goal_event_objective = coalesce(goal_event_objective, goal);

alter table public.athlete_profiles
  add constraint athlete_profiles_avatar_url_not_empty check (
    avatar_url is null or char_length(trim(avatar_url)) > 0
  ),
  add constraint athlete_profiles_goal_event_name_not_empty check (
    goal_event_name is null or char_length(trim(goal_event_name)) > 0
  ),
  add constraint athlete_profiles_goal_event_distance_positive check (
    goal_event_distance_km is null
    or (goal_event_distance_km > 0 and goal_event_distance_km <= 1000)
  ),
  add constraint athlete_profiles_goal_event_date_valid check (
    goal_event_date is null or goal_event_date >= date '1900-01-01'
  ),
  add constraint athlete_profiles_goal_event_location_not_empty check (
    goal_event_location is null or char_length(trim(goal_event_location)) > 0
  ),
  add constraint athlete_profiles_goal_event_objective_not_empty check (
    goal_event_objective is null or char_length(trim(goal_event_objective)) > 0
  );

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
  profile_goal_event_name text;
  profile_goal_event_distance_km numeric(7, 3);
  profile_goal_event_date date;
  profile_goal_event_location text;
  profile_goal_event_objective text;
begin
  profile_name := nullif(trim(new.raw_user_meta_data ->> 'name'), '');
  profile_sex := nullif(trim(new.raw_user_meta_data ->> 'sex'), '');
  profile_goal_event_name := nullif(
    trim(new.raw_user_meta_data ->> 'goal_event_name'),
    ''
  );
  profile_goal_event_location := nullif(
    trim(new.raw_user_meta_data ->> 'goal_event_location'),
    ''
  );
  profile_goal_event_objective := nullif(
    trim(new.raw_user_meta_data ->> 'goal_event_objective'),
    ''
  );

  begin
    profile_date_of_birth := nullif(
      trim(new.raw_user_meta_data ->> 'date_of_birth'),
      ''
    )::date;
    profile_weight_kg := nullif(
      trim(new.raw_user_meta_data ->> 'weight_kg'),
      ''
    )::numeric(6, 2);
    profile_goal_event_distance_km := nullif(
      trim(new.raw_user_meta_data ->> 'goal_event_distance_km'),
      ''
    )::numeric(7, 3);
    profile_goal_event_date := nullif(
      trim(new.raw_user_meta_data ->> 'goal_event_date'),
      ''
    )::date;
  exception
    when others then
      return new;
  end;

  if profile_name is null
    or profile_date_of_birth is null
    or profile_date_of_birth > current_date
    or profile_weight_kg is null
    or profile_weight_kg <= 0
    or profile_sex is null
    or profile_sex not in ('male', 'female', 'prefer_not_to_say')
    or profile_goal_event_name is null
    or profile_goal_event_distance_km is null
    or profile_goal_event_distance_km <= 0
    or profile_goal_event_distance_km > 1000
    or profile_goal_event_date is null
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
    natural_pace_seconds,
    goal_event_name,
    goal_event_distance_km,
    goal_event_date,
    goal_event_location,
    goal_event_objective
  ) values (
    new.id,
    profile_name,
    date_part('year', age(current_date, profile_date_of_birth))::integer,
    profile_date_of_birth,
    profile_sex,
    profile_weight_kg,
    profile_goal_event_name,
    profile_goal_event_date,
    coalesce(profile_goal_event_objective, 'Completar el evento según el plan'),
    360,
    profile_goal_event_name,
    profile_goal_event_distance_km,
    profile_goal_event_date,
    profile_goal_event_location,
    profile_goal_event_objective
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_athlete_profile() from public;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'profile-images',
  'profile-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "profile_images_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile_images_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile_images_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile_images_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;
