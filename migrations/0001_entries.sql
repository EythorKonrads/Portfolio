-- One row per Score that made the Scoreboard, kept for good even after it
-- drops off. The top 10 is a query (see worker/index.mjs).
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  initials TEXT NOT NULL,
  score INTEGER NOT NULL,
  wave INTEGER NOT NULL,
  time INTEGER NOT NULL,
  date TEXT NOT NULL
);

CREATE INDEX entries_rank ON entries (score DESC, date ASC);
