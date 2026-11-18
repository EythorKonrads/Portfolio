-- Ask's counters for its limits, and the Unanswered questions it keeps for
-- 90 days. The hourly cleanup is in worker/index.mjs.
CREATE TABLE ask_counters (
  key TEXT PRIMARY KEY,       -- 'visitor:<hmac>:<YYYY-MM-DDTHH>' or 'site:<YYYY-MM-DD>'
  count INTEGER NOT NULL,
  expires_at TEXT NOT NULL    -- end of that UTC hour, or the next UTC midnight
);

CREATE TABLE unanswered_questions (
  id TEXT PRIMARY KEY,        -- random UUID, as in Scores entries
  question TEXT NOT NULL,
  date TEXT NOT NULL          -- UTC YYYY-MM-DD only
);

CREATE INDEX unanswered_questions_date ON unanswered_questions (date);
