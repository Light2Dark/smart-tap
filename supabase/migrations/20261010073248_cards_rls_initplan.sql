drop policy cards_select on public.cards;
drop policy cards_insert on public.cards;
drop policy cards_update on public.cards;

create policy cards_select on public.cards
  for select
  to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id);

create policy cards_insert on public.cards
  for insert
  to authenticated
  with check (((select auth.jwt()) ->> 'sub') = user_id);

create policy cards_update on public.cards
  for update
  to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id)
  with check (((select auth.jwt()) ->> 'sub') = user_id);
