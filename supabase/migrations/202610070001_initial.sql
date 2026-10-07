-- NextBite 0.1: an explicit per-user cloud backup, not a normalized production nutrition DB.
create table public.user_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint valid_state_version check (data->>'version' = '1'),
  constraint valid_state_object check (jsonb_typeof(data) = 'object'),
  constraint bounded_state_size check (octet_length(data::text) <= 5242880)
);
alter table public.user_states enable row level security;
revoke all on public.user_states from anon;
grant select, insert, update, delete on public.user_states to authenticated;
create policy "Read own backup" on public.user_states for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own backup" on public.user_states for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own backup" on public.user_states for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own backup" on public.user_states for delete to authenticated using ((select auth.uid()) = user_id);
