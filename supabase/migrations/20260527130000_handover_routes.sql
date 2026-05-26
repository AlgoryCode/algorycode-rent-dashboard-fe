create table rent_handover_routes (
  id bigserial primary key,
  pickup_handover_location_id bigint not null references rent_handover_locations (id) on delete cascade,
  return_handover_location_id bigint not null references rent_handover_locations (id) on delete cascade,
  fee_eur numeric(12, 2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pickup_handover_location_id, return_handover_location_id)
);

create index rent_handover_routes_pickup_idx on rent_handover_routes (pickup_handover_location_id);
create index rent_handover_routes_return_idx on rent_handover_routes (return_handover_location_id);

alter table rent_rentals
  add column if not exists route_fee_eur numeric(12, 2),
  add column if not exists handover_route_id bigint references rent_handover_routes (id) on delete set null;

alter table rent_handover_routes enable row level security;

create policy rent_handover_routes_auth_select on rent_handover_routes
  for select to authenticated using (true);
create policy rent_handover_routes_auth_write on rent_handover_routes
  for all to authenticated using (true) with check (true);
