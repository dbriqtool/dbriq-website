-- dbriq.com: run once in Supabase > SQL Editor > New query > Run.
-- Creates the private bucket for the installer, lets signed-in users download from it,
-- and records who downloaded which version.

-- 1. Private bucket for the beta installer (not readable without signing in)
insert into storage.buckets (id, name, public)
values ('beta', 'beta', false)
on conflict (id) do nothing;

-- 2. Signed-in users may read (download) files in that bucket. Nobody can upload or delete
--    through the website; you upload in the Supabase dashboard.
drop policy if exists "Signed-in users can download the beta" on storage.objects;
create policy "Signed-in users can download the beta"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'beta');

-- 3. Download log
create table if not exists public.downloads (
  id            bigint generated always as identity primary key,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  version       text not null default '',
  downloaded_at timestamptz not null default now()
);

alter table public.downloads enable row level security;

drop policy if exists "Users record their own downloads" on public.downloads;
create policy "Users record their own downloads"
  on public.downloads for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users see their own downloads" on public.downloads;
create policy "Users see their own downloads"
  on public.downloads for select
  to authenticated
  using (user_id = auth.uid());

-- 4. Your view of beta users (only you can see it: in the SQL Editor, not through the website).
create or replace view public.beta_users
with (security_invoker = true) as
select u.email,
       u.raw_user_meta_data ->> 'full_name'   as full_name,
       u.raw_user_meta_data ->> 'company'     as company,
       u.raw_user_meta_data ->> 'role'        as role,
       (u.raw_user_meta_data ->> 'beta_updates')::boolean as wants_updates,
       u.created_at                            as signed_up,
       u.email_confirmed_at is not null        as confirmed,
       count(d.id)                             as downloads,
       max(d.downloaded_at)                    as last_download
from auth.users u
left join public.downloads d on d.user_id = u.id
group by u.id;

revoke all on public.beta_users from anon, authenticated;

-- See your beta users any time:
--   select * from public.beta_users order by signed_up desc;
