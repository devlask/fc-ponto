create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.users where id = auth.uid()), 'employee'::public.app_role);
$$;

create or replace function public.is_manager_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('manager'::public.app_role, 'admin'::public.app_role);
$$;

grant execute on function public.current_app_role() to authenticated, anon, service_role;
grant execute on function public.is_manager_or_admin() to authenticated, anon, service_role;

drop policy if exists "users_update_self_or_managers" on public.users;
create policy "users_update_self_or_managers"
on public.users
for update
to authenticated
using (id = auth.uid() or public.is_manager_or_admin())
with check (
  (id = auth.uid() and role = public.current_app_role())
  or public.is_manager_or_admin()
);
