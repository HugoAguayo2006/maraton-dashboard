begin;

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
  local_today date := (now() at time zone 'America/Mexico_City')::date;
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
      and date >= local_today
      and status <> 'completed';
  end if;

  for entry in select value from jsonb_array_elements(proposal.new_plan_data)
  loop
    session_data := entry -> 'session';
    if session_data is null or jsonb_typeof(session_data) <> 'object' then
      raise exception 'Invalid plan session payload';
    end if;
    if (session_data ->> 'date')::date < local_today then
      raise exception 'Past plan sessions cannot be changed';
    end if;

    if entry ->> 'action' = 'skip' then
      target_id := nullif(entry ->> 'targetId', '')::uuid;
      update public.training_plan_items
      set status = 'skipped',
          source_data = coalesce(source_data, '{}'::jsonb)
            || jsonb_build_object('bolt_ai_change_id', proposal.id)
      where id = target_id
        and user_id = proposal.user_id
        and date >= local_today
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
        and date >= local_today
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
