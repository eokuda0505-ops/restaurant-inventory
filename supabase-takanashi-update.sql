begin;

delete from public.inventory_items
where supplier = 'タカナシ';

insert into public.inventory_items (
  id,
  name,
  sku,
  category,
  supplier,
  location,
  unit,
  stock,
  ideal_weekday_stock,
  ideal_weekend_stock,
  reorder_point,
  unit_price,
  note
) values
  ('takanashi-0001', '新泉3.6牛乳L', 'TAKANASHI-0001', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 245, '内容量: 1000g / g単価: 0.25'),
  ('takanashi-0002', '有機牛乳', 'TAKANASHI-0002', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 450, '内容量: 1000g / g単価: 0.45'),
  ('takanashi-0003', 'Fクリーム38%1000ML', 'TAKANASHI-0003', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 1299, '内容量: 1000g / g単価: 1.30'),
  ('takanashi-0004', '新スーパーフレッシュ40', 'TAKANASHI-0004', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 1302, '内容量: 1000g / g単価: 1.30'),
  ('takanashi-0005', 'レクレプレス1000ML', 'TAKANASHI-0005', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 680, '内容量: 1000g / g単価: 0.68'),
  ('takanashi-0006', 'サワークリーム100g', 'TAKANASHI-0006', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 253, '内容量: 100g / g単価: 2.53'),
  ('takanashi-0007', 'タカナシビーンズバニラ2L', 'TAKANASHI-0007', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 2200, '内容量: 2000g / g単価: 1.10'),
  ('takanashi-0008', 'タカナシフロマージュブラン', 'TAKANASHI-0008', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 1050, '内容量: 500g / g単価: 2.10'),
  ('takanashi-0009', 'フェッセル500g', 'TAKANASHI-0009', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 1280, '内容量: 500g / g単価: 2.56'),
  ('takanashi-0010', 'マルサンアイ豆乳グルト400g', 'TAKANASHI-0010', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 210, '内容量: 400g / g単価: 0.53'),
  ('takanashi-0011', '泰喜ソイホイップL', 'TAKANASHI-0011', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 875, '内容量: 1000g / g単価: 0.88 / 1000ml-6本いり'),
  ('takanashi-0012', 'マリン乳酸バター有塩450G', 'TAKANASHI-0012', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 1150, '内容量: 450g / g単価: 2.56'),
  ('takanashi-0013', 'タカナシ北海道バター冷凍', 'TAKANASHI-0013', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 995, '内容量: 450g / g単価: 2.21'),
  ('takanashi-0014', 'タカナシ北海道リコッタ250G', 'TAKANASHI-0014', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 617, '内容量: 450g / g単価: 1.37'),
  ('takanashi-0015', '高梨マスカルポーネ250G', 'TAKANASHI-0015', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 642, '内容量: 250g / g単価: 2.57'),
  ('takanashi-0016', '高梨北海道クリームチーズ', 'TAKANASHI-0016', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 1660, '内容量: 1000g / g単価: 1.66'),
  ('takanashi-0017', 'LLOGアップル1000ML', 'TAKANASHI-0017', '乳製品、チーズ', 'タカナシ', '', 'g', 0, 0, 0, 0, 407, '内容量: 1000g / g単価: 0.41')
on conflict (id) do update set
  name = excluded.name,
  sku = excluded.sku,
  category = excluded.category,
  supplier = excluded.supplier,
  location = excluded.location,
  unit = excluded.unit,
  unit_price = excluded.unit_price,
  note = excluded.note;

commit;
