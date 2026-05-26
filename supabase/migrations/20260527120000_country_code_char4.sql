alter table rent_countries
  alter column code type char(4);

alter table rent_vehicles
  alter column country_code type char(4);
