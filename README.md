# FC Ponto

Sistema PWA de controle de ponto para a FC Comunicacao Visual, construido com `Next.js 15`, `TypeScript`, `TailwindCSS`, `Shadcn UI`, `Framer Motion` e `Supabase`.

## Stack

- Next.js 15 App Router
- TypeScript
- TailwindCSS
- Shadcn UI style components
- Framer Motion
- Supabase Auth, Realtime, Storage e PostgreSQL

## Modulos entregues

- Login e recuperacao de senha
- Areas separadas para funcionario e admin/gerente
- Registro de ponto com GPS obrigatorio, selfie ao vivo e suporte a multiplas jornadas
- Timeline diaria e historico
- Solicitacoes de ajuste com status
- Dashboard administrativo com ativos, mapa, relatorios e configuracoes
- PWA instalavel com service worker e offline parcial
- Migration SQL completa com RLS, auditoria, buckets de storage e views

## Ambiente

1. Instale dependencias:

```bash
npm install
```

2. Configure o ambiente:

```bash
cp .env.example .env.local
```

3. Preencha:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

4. Rode o app:

```bash
npm run dev
```

5. Aplique a migration SQL em `supabase/migrations/20260515224500_initial_fc_ponto.sql`.

## Observacoes

- Sem variaveis do Supabase, a interface abre em modo demonstracao para facilitar validacao visual.
- O middleware protege `/employee` e `/admin` quando o Auth estiver ativo.
- `time_entries` e `audit_logs` foram modelados como historico imutavel; ajustes devem gerar novos registros compensatorios.
- O fuso padrao da FC Comunicacao Visual esta configurado para `America/Manaus`.

## Convite por email

- Convites de funcionario agora redirecionam para `/auth/create-password?mode=invite`.
- Para personalizar o email de convite no Supabase, use o HTML em `supabase/email-templates/invite-user.html`.
- No painel do Supabase:
  - `Authentication > URL Configuration`
  - adicione a URL final do app em `Site URL`
  - adicione `https://seu-dominio/auth/create-password` em `Redirect URLs`
  - em `Authentication > Email Templates > Invite user`, cole o template HTML.
