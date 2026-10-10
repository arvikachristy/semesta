-- Execute once in the Supabase SQL editor, or through Supabase migrations.
create table public.workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint workspace_shape check (
    jsonb_typeof(payload) = 'object'
    and jsonb_typeof(payload->'countries') = 'array'
    and jsonb_typeof(payload->'trips') = 'array'
    and payload ? 'countries' and payload ? 'trips'
    and octet_length(payload::text) <= 1048576
  )
);
alter table public.workspaces enable row level security;
create policy "Read own workspace" on public.workspaces
  for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.workspaces from anon, authenticated;
grant select on public.workspaces to authenticated;

-- All writes compare revisions atomically, including first-account creation.
create function public.save_workspace(expected_revision integer, next_payload jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare new_revision integer;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if expected_revision = 0 then
    insert into public.workspaces(user_id, payload) values (auth.uid(), next_payload)
      on conflict (user_id) do nothing returning revision into new_revision;
  else
    update public.workspaces set payload = next_payload, revision = revision + 1, updated_at = now()
      where user_id = auth.uid() and revision = expected_revision returning revision into new_revision;
  end if;
  if new_revision is null then raise exception 'Backup revision conflict' using errcode = '40001'; end if;
  return new_revision;
end;
$$;
revoke all on function public.save_workspace(integer, jsonb) from public, anon;
grant execute on function public.save_workspace(integer, jsonb) to authenticated;

-- Authenticated self-deletion only; never accepts a user ID from the browser.
create function public.delete_own_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
