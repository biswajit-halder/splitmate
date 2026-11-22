-- Remove demo accounts and everything they own. Review before running.
DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'demo%@splitmate.app');
DELETE FROM activity_events WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'demo%@splitmate.app');
DELETE FROM password_resets WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'demo%@splitmate.app');
DELETE FROM settlements WHERE payer_id IN (SELECT id FROM users WHERE email LIKE 'demo%@splitmate.app') OR payee_id IN (SELECT id FROM users WHERE email LIKE 'demo%@splitmate.app');
DELETE FROM expense_splits WHERE expense_id IN (SELECT id FROM expenses WHERE paid_by IN (SELECT id FROM users WHERE email LIKE 'demo%@splitmate.app'));
DELETE FROM balances WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'demo%@splitmate.app') OR counterpart_id IN (SELECT id FROM users WHERE email LIKE 'demo%@splitmate.app');
DELETE FROM expenses WHERE paid_by IN (SELECT id FROM users WHERE email LIKE 'demo%@splitmate.app');
DELETE FROM friend_requests WHERE requester_id IN (SELECT id FROM users WHERE email LIKE 'demo%@splitmate.app') OR addressee_id IN (SELECT id FROM users WHERE email LIKE 'demo%@splitmate.app');
DELETE FROM group_members WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'demo%@splitmate.app');
DELETE FROM groups WHERE created_by IN (SELECT id FROM users WHERE email LIKE 'demo%@splitmate.app');
DELETE FROM users WHERE email LIKE 'demo%@splitmate.app';
