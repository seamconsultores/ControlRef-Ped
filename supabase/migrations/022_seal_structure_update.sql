-- Add new tracking columns to sellos_fiscales
alter table sellos_fiscales
add column if not exists aduana_id text, -- e.g. '240'
add column if not exists sociedad text, -- e.g. 'G&B Logistics'
add column if not exists asignado_a_ubicacion text; -- e.g. 'Bodega', 'Socio X', 'Stock'

-- Optional: Index on aduana_id for faster lookups
create index if not exists idx_sellos_aduana on sellos_fiscales(aduana_id);
create index if not exists idx_sellos_patente on sellos_fiscales(patente);
