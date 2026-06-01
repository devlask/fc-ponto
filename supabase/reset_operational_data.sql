begin;

alter table public.edit_requests disable trigger all;
alter table public.overtime_entries disable trigger all;
alter table public.time_entries disable trigger all;
alter table public.audit_logs disable trigger all;

delete from public.edit_requests;
delete from public.overtime_entries;
delete from public.time_entries;
delete from public.audit_logs
where target_table in ('time_entries', 'overtime_entries', 'edit_requests');

alter table public.audit_logs enable trigger all;
alter table public.time_entries enable trigger all;
alter table public.overtime_entries enable trigger all;
alter table public.edit_requests enable trigger all;

delete from storage.objects
where bucket_id in ('time-selfies', 'edit-support');

commit;

-- Preserva:
-- public.users
-- public.work_schedule_settings
-- storage de avatar de perfil
