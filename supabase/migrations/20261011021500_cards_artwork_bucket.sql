insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types, type)
values (
  'cards',
  'cards',
  false,
  8388608,
  array['image/png', 'image/jpeg', 'image/webp'],
  'STANDARD'
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists cards_objects_select on storage.objects;
drop policy if exists cards_objects_insert on storage.objects;
drop policy if exists cards_objects_update on storage.objects;
drop policy if exists cards_objects_delete on storage.objects;

create policy cards_objects_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'cards'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

create policy cards_objects_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cards'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

create policy cards_objects_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'cards'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
)
with check (
  bucket_id = 'cards'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

create policy cards_objects_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'cards'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);
