-- Application revision conflicts are permanent for the supplied revision.
-- 40001 means a retryable serialization failure and can make PostgREST 14 loop.
-- PT409 returns HTTP 409 without requesting a transaction retry.
create or replace function public.save_workspace(expected_revision integer, next_payload jsonb)
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
  if new_revision is null then raise exception 'Backup revision conflict' using errcode = 'PT409'; end if;
  return new_revision;
end;
$$;

-- CREATE OR REPLACE retains the existing ownership and execute privileges.
-- Already-looping backends must be identified and stopped separately; see docs/account-setup.md.
