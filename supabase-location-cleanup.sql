begin;

update public.inventory_items
set location = case
  when location in ('冷凍１', '冷凍1', '冷凍庫1') then '冷凍庫１'
  when location in ('冷凍２', '冷凍2', '冷凍庫2') then '冷凍庫２'
  when location in ('冷蔵１', '冷蔵1', '冷蔵庫1') then '冷蔵庫１'
  when location in ('冷蔵２', '冷蔵2', '冷蔵庫2') then '冷蔵庫２'
  else location
end
where location in (
  '冷凍１',
  '冷凍1',
  '冷凍２',
  '冷凍2',
  '冷凍庫1',
  '冷凍庫2',
  '冷蔵１',
  '冷蔵1',
  '冷蔵２',
  '冷蔵2',
  '冷蔵庫1',
  '冷蔵庫2'
);

commit;
