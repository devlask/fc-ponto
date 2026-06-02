create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('employee', 'manager', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'time_entry_type') then
    create type public.time_entry_type as enum ('entry', 'pause', 'return', 'exit', 'overtime');
  end if;
  if not exists (select 1 from pg_type where typname = 'approval_status') then
    create type public.approval_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.app_role not null default 'employee',
  manager_id uuid references public.users(id) on delete set null,
  employee_code text unique,
  phone text,
  avatar_url text,
  device_whitelist jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.work_schedule_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Jornada padrao FC',
  company_name text not null default 'FC Comunicacao Visual',
  timezone text not null default 'America/Manaus',
  is_active boolean not null default true,
  tolerance_minutes integer not null default 10 check (tolerance_minutes >= 0),
  overtime_grace_minutes integer not null default 0 check (overtime_grace_minutes >= 0),
  geofence_enabled boolean not null default true,
  geofence_center_lat numeric(10, 7),
  geofence_center_lng numeric(10, 7),
  geofence_radius_meters integer not null default 180,
  daily_rules jsonb not null default '{
    "0":{"enabled":false,"start":"00:00","end":"00:00"},
    "1":{"enabled":true,"start":"08:00","end":"18:00"},
    "2":{"enabled":true,"start":"08:00","end":"18:00"},
    "3":{"enabled":true,"start":"08:00","end":"18:00"},
    "4":{"enabled":true,"start":"08:00","end":"18:00"},
    "5":{"enabled":true,"start":"08:00","end":"17:00"},
    "6":{"enabled":false,"start":"00:00","end":"00:00"}
  }'::jsonb,
  overtime_policy jsonb not null default '{"night_start":"22:00","night_end":"05:00","require_approval_above_minutes":0}'::jsonb,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  schedule_setting_id uuid references public.work_schedule_settings(id) on delete set null,
  event_type public.time_entry_type not null,
  recorded_at timestamptz not null default timezone('utc', now()),
  business_date date,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  accuracy_meters numeric(8, 2) not null,
  geofence_status text not null default 'inside',
  selfie_path text not null,
  selfie_hash text,
  ip_address inet,
  device_id text not null,
  device_label text not null,
  source text not null default 'pwa',
  is_manual boolean not null default false,
  is_overtime boolean not null default false,
  overtime_reason text,
  pairing_group uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.overtime_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  schedule_setting_id uuid references public.work_schedule_settings(id) on delete set null,
  start_entry_id uuid references public.time_entries(id) on delete set null,
  end_entry_id uuid references public.time_entries(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  total_minutes integer not null check (total_minutes >= 0),
  normal_minutes integer not null default 0 check (normal_minutes >= 0),
  overtime_minutes integer not null default 0 check (overtime_minutes >= 0),
  overtime_category text not null default 'configured_limit',
  approval_status public.approval_status not null default 'pending',
  approved_by uuid references public.users(id) on delete set null,
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.edit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_entry_id uuid references public.time_entries(id) on delete set null,
  requested_event_type public.time_entry_type not null,
  requested_timestamp timestamptz not null,
  requested_date date not null,
  reason text not null,
  supporting_selfie_path text,
  status public.approval_status not null default 'pending',
  reviewer_id uuid references public.users(id) on delete set null,
  review_notes text,
  created_adjustment_entry_id uuid references public.time_entries(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  target_table text not null,
  target_id uuid,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  device_label text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_users_role on public.users(role);
create index if not exists idx_time_entries_user_date on public.time_entries(user_id, business_date desc);
create index if not exists idx_time_entries_recorded_at on public.time_entries(recorded_at desc);
create index if not exists idx_time_entries_overtime on public.time_entries(is_overtime, recorded_at desc);
create index if not exists idx_overtime_entries_user_start on public.overtime_entries(user_id, started_at desc);
create index if not exists idx_edit_requests_status on public.edit_requests(status, created_at desc);
create index if not exists idx_audit_logs_target on public.audit_logs(target_table, target_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
as $$
  select coalesce((select role from public.users where id = auth.uid()), 'employee'::public.app_role);
$$;

create or replace function public.is_manager_or_admin()
returns boolean
language sql
stable
as $$
  select public.current_app_role() in ('manager'::public.app_role, 'admin'::public.app_role);
$$;

create or replace function public.insert_audit_log(
  target_table text,
  target_id uuid,
  action text,
  before_data jsonb default null,
  after_data jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (
    actor_user_id,
    target_table,
    target_id,
    action,
    before_data,
    after_data
  )
  values (
    auth.uid(),
    target_table,
    target_id,
    action,
    before_data,
    after_data
  );
end;
$$;

create or replace function public.audit_row_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.insert_audit_log(tg_table_name, new.id, 'insert', null, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.insert_audit_log(tg_table_name, new.id, 'update', to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    perform public.insert_audit_log(tg_table_name, old.id, 'delete', to_jsonb(old), null);
    return old;
  end if;
  return null;
end;
$$;

create or replace function public.prevent_audit_log_changes()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs is immutable';
end;
$$;

create or replace function public.prevent_time_entry_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'time_entries is immutable; create adjustment entries instead';
end;
$$;

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

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'employee'::public.app_role)
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_work_schedule_settings_updated_at on public.work_schedule_settings;
create trigger trg_work_schedule_settings_updated_at
before update on public.work_schedule_settings
for each row execute function public.set_updated_at();

drop trigger if exists trg_overtime_entries_updated_at on public.overtime_entries;
create trigger trg_overtime_entries_updated_at
before update on public.overtime_entries
for each row execute function public.set_updated_at();

drop trigger if exists trg_edit_requests_updated_at on public.edit_requests;
create trigger trg_edit_requests_updated_at
before update on public.edit_requests
for each row execute function public.set_updated_at();

drop trigger if exists trg_time_entries_hydrate on public.time_entries;
create trigger trg_time_entries_hydrate
before insert on public.time_entries
for each row execute function public.hydrate_time_entry_defaults();

drop trigger if exists trg_time_entries_immutable_update on public.time_entries;
create trigger trg_time_entries_immutable_update
before update on public.time_entries
for each row execute function public.prevent_time_entry_mutation();

drop trigger if exists trg_time_entries_immutable_delete on public.time_entries;
create trigger trg_time_entries_immutable_delete
before delete on public.time_entries
for each row execute function public.prevent_time_entry_mutation();

drop trigger if exists trg_audit_logs_immutable_update on public.audit_logs;
create trigger trg_audit_logs_immutable_update
before update on public.audit_logs
for each row execute function public.prevent_audit_log_changes();

drop trigger if exists trg_audit_logs_immutable_delete on public.audit_logs;
create trigger trg_audit_logs_immutable_delete
before delete on public.audit_logs
for each row execute function public.prevent_audit_log_changes();

drop trigger if exists trg_users_audit on public.users;
create trigger trg_users_audit
after insert or update or delete on public.users
for each row execute function public.audit_row_changes();

drop trigger if exists trg_schedule_audit on public.work_schedule_settings;
create trigger trg_schedule_audit
after insert or update or delete on public.work_schedule_settings
for each row execute function public.audit_row_changes();

drop trigger if exists trg_time_entries_audit on public.time_entries;
create trigger trg_time_entries_audit
after insert on public.time_entries
for each row execute function public.audit_row_changes();

drop trigger if exists trg_overtime_audit on public.overtime_entries;
create trigger trg_overtime_audit
after insert or update or delete on public.overtime_entries
for each row execute function public.audit_row_changes();

drop trigger if exists trg_edit_requests_audit on public.edit_requests;
create trigger trg_edit_requests_audit
after insert or update or delete on public.edit_requests
for each row execute function public.audit_row_changes();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace view public.vw_active_workers as
with latest_entries as (
  select distinct on (user_id)
    id,
    user_id,
    event_type,
    recorded_at,
    latitude,
    longitude,
    accuracy_meters,
    is_overtime
  from public.time_entries
  order by user_id, recorded_at desc
)
select
  u.id as user_id,
  u.full_name,
  u.role,
  le.event_type as last_event_type,
  le.recorded_at as last_recorded_at,
  le.latitude,
  le.longitude,
  le.accuracy_meters,
  case
    when le.event_type = 'pause' then 'paused'
    when le.is_overtime then 'overtime'
    when le.event_type in ('entry', 'return', 'overtime') then 'working'
    else 'off'
  end as current_state
from public.users u
left join latest_entries le on le.user_id = u.id
where u.is_active = true;

create or replace view public.vw_daily_hours as
select
  te.user_id,
  u.full_name,
  te.business_date,
  count(*) as total_events,
  count(*) filter (where te.is_overtime) as overtime_events,
  min(te.recorded_at) as first_event_at,
  max(te.recorded_at) as last_event_at
from public.time_entries te
join public.users u on u.id = te.user_id
group by te.user_id, u.full_name, te.business_date;

alter table public.users enable row level security;
alter table public.work_schedule_settings enable row level security;
alter table public.time_entries enable row level security;
alter table public.overtime_entries enable row level security;
alter table public.edit_requests enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "users_select_self_or_managers" on public.users;
create policy "users_select_self_or_managers"
on public.users
for select
to authenticated
using (id = auth.uid() or public.is_manager_or_admin());

drop policy if exists "users_update_self_or_managers" on public.users;
create policy "users_update_self_or_managers"
on public.users
for update
to authenticated
using (id = auth.uid() or public.is_manager_or_admin())
with check (
  (id = auth.uid() and role = (select role from public.users where id = auth.uid()))
  or public.is_manager_or_admin()
);

drop policy if exists "schedule_select_authenticated" on public.work_schedule_settings;
create policy "schedule_select_authenticated"
on public.work_schedule_settings
for select
to authenticated
using (true);

drop policy if exists "schedule_manage_admins" on public.work_schedule_settings;
create policy "schedule_manage_admins"
on public.work_schedule_settings
for all
to authenticated
using (public.is_manager_or_admin())
with check (public.is_manager_or_admin());

drop policy if exists "time_entries_select_own_or_managers" on public.time_entries;
create policy "time_entries_select_own_or_managers"
on public.time_entries
for select
to authenticated
using (user_id = auth.uid() or public.is_manager_or_admin());

drop policy if exists "time_entries_insert_own_or_managers" on public.time_entries;
create policy "time_entries_insert_own_or_managers"
on public.time_entries
for insert
to authenticated
with check (user_id = auth.uid() or public.is_manager_or_admin());

drop policy if exists "overtime_select_own_or_managers" on public.overtime_entries;
create policy "overtime_select_own_or_managers"
on public.overtime_entries
for select
to authenticated
using (user_id = auth.uid() or public.is_manager_or_admin());

drop policy if exists "overtime_manage_admins" on public.overtime_entries;
create policy "overtime_manage_admins"
on public.overtime_entries
for all
to authenticated
using (public.is_manager_or_admin())
with check (public.is_manager_or_admin());

drop policy if exists "edit_requests_select_own_or_managers" on public.edit_requests;
create policy "edit_requests_select_own_or_managers"
on public.edit_requests
for select
to authenticated
using (user_id = auth.uid() or public.is_manager_or_admin());

drop policy if exists "edit_requests_insert_own" on public.edit_requests;
create policy "edit_requests_insert_own"
on public.edit_requests
for insert
to authenticated
with check (user_id = auth.uid() or public.is_manager_or_admin());

drop policy if exists "edit_requests_update_managers" on public.edit_requests;
create policy "edit_requests_update_managers"
on public.edit_requests
for update
to authenticated
using (public.is_manager_or_admin())
with check (public.is_manager_or_admin());

drop policy if exists "audit_logs_select_own_or_managers" on public.audit_logs;
create policy "audit_logs_select_own_or_managers"
on public.audit_logs
for select
to authenticated
using (actor_user_id = auth.uid() or public.is_manager_or_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('time-selfies', 'time-selfies', false, 5242880, array['image/jpeg', 'image/png']),
  ('edit-support', 'edit-support', false, 5242880, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;

drop policy if exists "time_selfies_select_own_or_managers" on storage.objects;
create policy "time_selfies_select_own_or_managers"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'time-selfies'
  and (
    public.is_manager_or_admin()
    or owner = auth.uid()
  )
);

drop policy if exists "time_selfies_insert_own" on storage.objects;
create policy "time_selfies_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'time-selfies'
  and owner = auth.uid()
);

drop policy if exists "edit_support_select_own_or_managers" on storage.objects;
create policy "edit_support_select_own_or_managers"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'edit-support'
  and (
    public.is_manager_or_admin()
    or owner = auth.uid()
  )
);

drop policy if exists "edit_support_insert_own" on storage.objects;
create policy "edit_support_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'edit-support'
  and owner = auth.uid()
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table
        public.time_entries,
        public.overtime_entries,
        public.edit_requests,
        public.work_schedule_settings;
    exception
      when duplicate_object then null;
    end;
  end if;
end
$$;
