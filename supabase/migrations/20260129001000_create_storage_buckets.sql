insert into storage.buckets (id, name, public)
values ('room-images', 'room-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('customer-ids', 'customer-ids', false)
on conflict (id) do nothing;
