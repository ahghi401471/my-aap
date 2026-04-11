export const schemaSql = `
CREATE TABLE IF NOT EXISTS cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS streets (
  id TEXT PRIMARY KEY,
  city_name TEXT NOT NULL,
  street_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  city_id TEXT NOT NULL REFERENCES cities(id),
  street_name TEXT,
  house_number TEXT,
  lat REAL,
  lng REAL
);

CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_equipment (
  user_id TEXT NOT NULL REFERENCES users(id),
  equipment_id TEXT NOT NULL REFERENCES equipment(id),
  PRIMARY KEY (user_id, equipment_id)
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  requester_user_id TEXT NOT NULL REFERENCES users(id),
  equipment_ids_json TEXT NOT NULL,
  search_mode TEXT NOT NULL CHECK (search_mode IN ('gps', 'city')),
  city_id TEXT,
  street_name TEXT,
  house_number TEXT,
  lat REAL,
  lng REAL,
  created_at TEXT NOT NULL
);
`;
