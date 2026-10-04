-- Announcements can be published before their schedule or location is known.
alter table public.events
  alter column starts_at drop not null,
  alter column ends_at drop not null,
  alter column location drop not null;

alter table public.events
  add constraint events_time_pair_check
  check ((starts_at is null and ends_at is null) or (starts_at is not null and ends_at is not null));

alter table public.events drop constraint if exists events_external_url_check;
alter table public.events
  add constraint events_external_url_check
  check (external_url is null or external_url ~* '^https?://[^[:space:]]+$');

alter table public.events add column image_path text;
create index events_created_at_idx on public.events (created_at desc);

-- Images remain private to approved club members.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-images', 'event-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "event_images_read_active_members"
on storage.objects for select to authenticated
using (bucket_id = 'event-images' and (select private.is_active_member()));

create policy "event_images_upload_staff"
on storage.objects for insert to authenticated
with check (bucket_id = 'event-images' and (select private.is_staff()));

create policy "event_images_delete_staff"
on storage.objects for delete to authenticated
using (bucket_id = 'event-images' and (select private.is_staff()));
