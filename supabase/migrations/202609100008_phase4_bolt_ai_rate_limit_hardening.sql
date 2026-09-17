begin;

drop policy if exists "ai_usage_events_insert_own" on public.ai_usage_events;
drop policy if exists "ai_usage_events_update_own" on public.ai_usage_events;
drop policy if exists "ai_usage_events_delete_own" on public.ai_usage_events;

revoke insert, update, delete on public.ai_usage_events from authenticated;

create or replace function public.begin_bolt_ai_usage(
  p_operation text,
  p_maximum integer,
  p_window_seconds integer
)
returns table(event_id uuid, request_id uuid)
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  current_user_id uuid := (select auth.uid());
  recent_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_operation not in ('chat', 'plan_generation', 'progress_analysis', 'plan_change') then
    raise exception 'Unsupported Bolt AI operation';
  end if;
  if p_maximum < 1 or p_maximum > 1000 or p_window_seconds < 60 or p_window_seconds > 604800 then
    raise exception 'Invalid Bolt AI rate limit configuration';
  end if;

  perform pg_advisory_xact_lock(hashtext(current_user_id::text || ':' || p_operation));

  select count(*) into recent_count
  from public.ai_usage_events
  where user_id = current_user_id
    and operation = p_operation
    and created_at >= now() - make_interval(secs => p_window_seconds);

  if recent_count >= p_maximum then
    raise exception 'Bolt AI rate limit reached';
  end if;

  return query
  insert into public.ai_usage_events (user_id, operation)
  values (current_user_id, p_operation)
  returning id, ai_usage_events.request_id;
end;
$$;

create or replace function public.complete_bolt_ai_usage(
  p_event_id uuid,
  p_success boolean,
  p_duration_ms integer,
  p_token_estimate integer
)
returns boolean
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  current_user_id uuid := (select auth.uid());
  affected integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.ai_usage_events
  set success = p_success,
      duration_ms = greatest(0, p_duration_ms),
      token_estimate = case when p_token_estimate is null then null else greatest(0, p_token_estimate) end
  where id = p_event_id and user_id = current_user_id;

  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

revoke all on function public.begin_bolt_ai_usage(text, integer, integer) from public;
revoke all on function public.begin_bolt_ai_usage(text, integer, integer) from anon;
grant execute on function public.begin_bolt_ai_usage(text, integer, integer) to authenticated;

revoke all on function public.complete_bolt_ai_usage(uuid, boolean, integer, integer) from public;
revoke all on function public.complete_bolt_ai_usage(uuid, boolean, integer, integer) from anon;
grant execute on function public.complete_bolt_ai_usage(uuid, boolean, integer, integer) to authenticated;

commit;
