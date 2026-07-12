begin;

update public.inventory_items
set category = '酒類'
where supplier in ('名畑', '小松屋', '小松屋→名畑');

commit;
