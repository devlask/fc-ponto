alter table public.work_schedule_settings
  alter column timezone set default 'America/Manaus';

update public.work_schedule_settings
set timezone = 'America/Manaus'
where timezone is null
   or timezone = 'America/Sao_Paulo';

create or replace function public.hydrate_time_entry_defaults()
returns trigger
language plpgsql
as $$
declare
  schedule_row public.work_schedule_settings%rowtype;
  local_timestamp timestamp;
  day_key text;
  rule jsonb;
  end_limit time;
begin
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
    new.business_date = local_timestamp::date;
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
    new.business_date = timezone('America/Manaus', new.recorded_at)::date;
  end if;

  return new;
end;
$$;
