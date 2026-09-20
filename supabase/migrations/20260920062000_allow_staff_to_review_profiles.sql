drop policy if exists "profiles_select_authorized" on public.profiles;

create policy "profiles_select_authorized"
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or (status = 'active' and (select private.is_active_member()))
  or (select private.is_staff())
);
