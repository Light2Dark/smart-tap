create table public.cards (
  id bigint generated always as identity primary key,
  user_id text not null,
  title text not null,
  destination_url text not null,
  public_id text not null default encode(extensions.gen_random_bytes(12), 'hex'),
  image_path text,
  design_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint cards_user_id_not_blank check (char_length(btrim(user_id)) > 0),
  constraint cards_title_not_blank check (char_length(btrim(title)) between 1 and 80),
  constraint cards_destination_https check (destination_url ~ '^https://[^[:space:]]+$'),
  constraint cards_public_id_unique unique (public_id)
);

create index cards_user_id_idx on public.cards (user_id);
create index cards_user_active_idx on public.cards (user_id, updated_at desc)
  where deleted_at is null;

alter table public.cards enable row level security;
alter table public.cards force row level security;

create policy cards_select on public.cards
  for select
  to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

create policy cards_insert on public.cards
  for insert
  to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy cards_update on public.cards
  for update
  to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);

create function public.cards_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
       or new.user_id is distinct from old.user_id
       or new.public_id is distinct from old.public_id
       or new.created_at is distinct from old.created_at then
      raise exception 'card identity is immutable';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger cards_before_write
  before insert or update on public.cards
  for each row
  execute function public.cards_before_write();

revoke all on function public.cards_before_write() from public, anon, authenticated;

create function public.resolve_card_destination(card_public_id text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select destination_url
  from public.cards
  where public_id = card_public_id
    and deleted_at is null
$$;

revoke all on function public.resolve_card_destination(text) from public;
grant execute on function public.resolve_card_destination(text) to anon, authenticated, service_role;

revoke all on table public.cards from public, anon;
grant select, insert, update on table public.cards to authenticated;
grant select, insert, update, delete on table public.cards to service_role;
grant usage, select on sequence public.cards_id_seq to authenticated, service_role;
