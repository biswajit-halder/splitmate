-- SplitMate indexes for the hot query paths.

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
-- Partial unique index: one active membership per user per group
CREATE UNIQUE INDEX idx_group_members_user_active ON group_members(group_id, user_id) WHERE user_id IS NOT NULL;
-- Partial unique index: one pending invite per email per group
CREATE UNIQUE INDEX idx_group_members_invite_email ON group_members(group_id, email) WHERE user_id IS NULL;

CREATE INDEX idx_expenses_group_id ON expenses(group_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id ON expense_splits(user_id);

CREATE INDEX idx_balances_group_id ON balances(group_id);
CREATE INDEX idx_balances_user_id ON balances(user_id);
CREATE INDEX idx_balances_counterpart ON balances(counterpart_id);

CREATE INDEX idx_settlements_group_id ON settlements(group_id);
CREATE INDEX idx_settlements_payer ON settlements(payer_id);
CREATE INDEX idx_settlements_payee ON settlements(payee_id);

CREATE INDEX idx_friend_requests_requester ON friend_requests(requester_id);
CREATE INDEX idx_friend_requests_addressee ON friend_requests(addressee_id);

CREATE INDEX idx_activity_user_id ON activity_events(user_id);
CREATE INDEX idx_activity_group_id ON activity_events(group_id);
CREATE INDEX idx_activity_created_at ON activity_events(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);

CREATE INDEX idx_spending_month_user ON spending_summary_monthly(user_id, month);
