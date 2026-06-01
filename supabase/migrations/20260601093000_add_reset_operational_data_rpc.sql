create or replace function public.reset_operational_data()
returns jsonb
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  time_entries_count integer := 0;
  overtime_entries_count integer := 0;
  edit_requests_count integer := 0;
  audit_logs_count integer := 0;
  storage_objects_count integer := 0;
begin
  select count(*) into time_entries_count from public.time_entries;
  select count(*) into overtime_entries_count from public.overtime_entries;
  select count(*) into edit_requests_count from public.edit_requests;
  select count(*) into audit_logs_count
  from public.audit_logs
  where target_table in ('time_entries', 'overtime_entries', 'edit_requests');
  select count(*) into storage_objects_count
  from storage.objects
  where bucket_id in ('time-selfies', 'edit-support');

  truncate table public.edit_requests, public.overtime_entries, public.time_entries;

  delete from storage.objects
  where bucket_id in ('time-selfies', 'edit-support');

  return jsonb_build_object(
    'timeEntries', time_entries_count,
    'overtimeEntries', overtime_entries_count,
    'editRequests', edit_requests_count,
    'auditLogs', audit_logs_count,
    'storageObjects', storage_objects_count
  );
end;
$$;

revoke all on function public.reset_operational_data() from public;
grant execute on function public.reset_operational_data() to authenticated;
