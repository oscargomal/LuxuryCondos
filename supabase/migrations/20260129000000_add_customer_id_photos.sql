alter table customers
  add column if not exists id_photo_front text,
  add column if not exists id_photo_back text;
