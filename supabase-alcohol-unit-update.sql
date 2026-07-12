begin;

update public.inventory_items
set unit = '本'
where category = '酒類';

commit;
