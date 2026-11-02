-- Ejecuta en Supabase > SQL Editor. Solo preferencias; NUNCA audio.
create table if not exists public.preferences(
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{}', updated_at timestamptz default now());
alter table public.preferences enable row level security;
create policy "leer propias" on public.preferences for select using (auth.uid()=user_id);
create policy "crear propias" on public.preferences for insert with check (auth.uid()=user_id);
create policy "editar propias" on public.preferences for update using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "borrar propias" on public.preferences for delete using (auth.uid()=user_id);
