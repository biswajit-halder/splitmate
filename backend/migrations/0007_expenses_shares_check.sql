-- SQLite/D1 cannot relax the split_mode CHECK without rebuilding the table
-- (which trips FK constraints). Store the extended split kind separately.
ALTER TABLE expenses ADD COLUMN split_variant TEXT;
