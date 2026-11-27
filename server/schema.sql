-- Keşif photo server database (Cloudflare D1, SQLite).
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,            -- 24 hex chars, also the R2 file name photos/<id>.jpg
  place TEXT NOT NULL,            -- place key: stop id, wp:<lang>:<page>, or p_<lat>_<lon>
  place_name TEXT NOT NULL DEFAULT '',
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  name TEXT NOT NULL DEFAULT '',  -- the name shown in the app (not a real name unless they typed one)
  kind TEXT NOT NULL DEFAULT 'view',
  device TEXT NOT NULL,           -- random id made on the phone; no account
  token TEXT NOT NULL,            -- lets the owner delete the photo
  status TEXT NOT NULL DEFAULT 'live', -- live | hidden (reported) | deleted (by owner) | removed (by review)
  hidden_at TEXT,                 -- when it was hidden or removed (for strikes and clean-up)
  created TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS photos_place ON photos (place, status, created);
CREATE INDEX IF NOT EXISTS photos_geo ON photos (status, lat, lon);
CREATE INDEX IF NOT EXISTS photos_device ON photos (device, created);

CREATE TABLE IF NOT EXISTS reports (
  photo TEXT NOT NULL,
  device TEXT NOT NULL,
  created TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (photo, device)
);

CREATE TABLE IF NOT EXISTS banned (
  device TEXT PRIMARY KEY,
  created TEXT NOT NULL DEFAULT (datetime('now'))
);
