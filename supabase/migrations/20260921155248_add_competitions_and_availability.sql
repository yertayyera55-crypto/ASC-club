alter table public.profiles
drop constraint if exists profiles_direction_check;

alter table public.profiles
add constraint profiles_direction_check
check (direction in ('Machine Learning', 'Arduino', 'Programming', 'Both', 'Not sure'));

alter table public.events
add column event_type text not null default 'meeting',
add column external_url text;

alter table public.events
add constraint events_type_check
check (event_type in ('meeting', 'competition')),
add constraint events_external_url_check
check (
  (event_type = 'meeting' and external_url is null)
  or (event_type = 'competition' and external_url ~* '^https?://[^[:space:]]+$')
);

create table public.member_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  availability_days text[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint member_preferences_days_check check (
    availability_days <@ array['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']::text[]
    and cardinality(availability_days) <= 7
  )
);

create table public.event_interests (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index event_interests_user_id_idx on public.event_interests(user_id);

create trigger member_preferences_set_updated_at
before update on public.member_preferences
for each row execute function private.set_updated_at();

alter table public.member_preferences enable row level security;
alter table public.event_interests enable row level security;

revoke all on public.member_preferences from anon, authenticated;
revoke all on public.event_interests from anon, authenticated;

grant select, insert, update (availability_days) on public.member_preferences to authenticated;
grant select, insert, delete on public.event_interests to authenticated;

create policy "preferences_select_authorized"
on public.member_preferences for select
to authenticated
using (user_id = (select auth.uid()) or (select private.is_staff()));

create policy "preferences_insert_self"
on public.member_preferences for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "preferences_update_self"
on public.member_preferences for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "event_interests_select_active_members"
on public.event_interests for select
to authenticated
using ((select private.is_active_member()));

create policy "event_interests_insert_self"
on public.event_interests for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (select private.is_active_member())
  and exists (
    select 1
    from public.events
    where events.id = event_interests.event_id
      and events.event_type = 'competition'
      and events.status = 'upcoming'
  )
);

create policy "event_interests_delete_self"
on public.event_interests for delete
to authenticated
using (user_id = (select auth.uid()));
