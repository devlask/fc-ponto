begin;

truncate table public.edit_requests, public.overtime_entries, public.time_entries;

commit;

-- Preserva:
-- public.users
-- public.work_schedule_settings
-- public.audit_logs
-- storage de avatar de perfil
-- Arquivos de selfie/suporte devem ser limpos pela Storage API
