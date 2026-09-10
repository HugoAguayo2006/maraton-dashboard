begin;

create or replace function public.handle_new_athlete_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  profile_date_of_birth date;
  profile_age integer;
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
    profile_age := date_part(
      'year',
      age(current_date, profile_date_of_birth)
    )::integer;
  exception
    when others then
      return new;
  end;

  if profile_name is null
    or profile_date_of_birth is null
    or profile_date_of_birth > current_date
    or profile_age not between 1 and 120
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
    profile_age,
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

commit;
