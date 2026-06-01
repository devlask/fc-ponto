begin;

truncate table public.edit_requests, public.overtime_entries, public.time_entries;

delete from storage.objects
where bucket_id in ('time-selfies', 'edit-support');

commit;

-- Preserva:
-- public.users
-- public.work_schedule_settings
-- public.audit_logs
-- storage de avatar de perfil
