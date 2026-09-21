drop policy if exists "rsvps_insert_self" on public.event_rsvps;

create policy "rsvps_insert_self"
on public.event_rsvps for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (select private.is_active_member())
  and exists (
    select 1
    from public.events
    where events.id = event_rsvps.event_id
      and events.event_type = 'meeting'
      and events.status = 'upcoming'
  )
);
