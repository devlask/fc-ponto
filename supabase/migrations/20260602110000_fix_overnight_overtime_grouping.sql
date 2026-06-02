create or replace function public.hydrate_time_entry_defaults()
returns trigger
language plpgsql
as $$
declare
  schedule_row public.work_schedule_settings%rowtype;
  latest_user_entry public.time_entries%rowtype;
  local_timestamp timestamp;
  day_key text;
  rule jsonb;
  end_limit time;
  derived_business_date date;
begin
  select *
    into latest_user_entry
  from public.time_entries
  where user_id = new.user_id
  order by recorded_at desc
  limit 1;

  if new.schedule_setting_id is null then
    select *
      into schedule_row
    from public.work_schedule_settings
    where is_active = true
    order by updated_at desc
    limit 1;

    new.schedule_setting_id = schedule_row.id;
  else
    select *
      into schedule_row
    from public.work_schedule_settings
    where id = new.schedule_setting_id;
  end if;

  if schedule_row.id is not null then
    local_timestamp = timezone(schedule_row.timezone, new.recorded_at);
    derived_business_date = local_timestamp::date;
    new.business_date = derived_business_date;
    day_key = extract(dow from local_timestamp)::int::text;
    rule = schedule_row.daily_rules -> day_key;

    if coalesce((rule ->> 'enabled')::boolean, false) = false then
      new.is_overtime = true;
      new.overtime_reason = coalesce(new.overtime_reason, 'disabled_day');
    else
      end_limit = (rule ->> 'end')::time;
      if local_timestamp::time > end_limit + make_interval(mins => schedule_row.overtime_grace_minutes) then
        new.is_overtime = true;
        new.overtime_reason = coalesce(new.overtime_reason, 'configured_limit');
      end if;
    end if;
  else
    derived_business_date = timezone('America/Manaus', new.recorded_at)::date;
    new.business_date = derived_business_date;
  end if;

  if new.pairing_group is null then
    new.pairing_group = gen_random_uuid();
  end if;

  if new.event_type in ('exit', 'pause')
     and latest_user_entry.id is not null
     and latest_user_entry.event_type in ('entry', 'return', 'overtime') then
    new.business_date = coalesce(latest_user_entry.business_date, derived_business_date);
    new.pairing_group = coalesce(latest_user_entry.pairing_group, latest_user_entry.id, new.pairing_group);
  elsif new.event_type in ('entry', 'return', 'overtime') then
    new.pairing_group = coalesce(new.pairing_group, gen_random_uuid());
  end if;

  return new;
end;
$$;
