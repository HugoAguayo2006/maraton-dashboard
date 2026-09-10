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
    or profile_sex is null
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

commit;
