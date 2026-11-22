-- The denormalised monthly spending summary drifted out of sync with the
-- expenses table (edits/deletes were never reflected, and deleting a group
-- wiped unrelated months). Analytics now aggregates the source tables at read
-- time, so the table is dropped.
DROP TABLE IF EXISTS spending_summary_monthly;
