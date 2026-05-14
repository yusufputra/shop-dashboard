-- Relasi many-to-many login ↔ user_groups + izin menu "users" untuk manajemen pengguna.
-- Aman dijalankan berulang (idempotent).

CREATE TABLE IF NOT EXISTS login_user_groups (
  user_id UUID NOT NULL REFERENCES login(user_id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES user_groups(group_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_login_user_groups_user ON login_user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_login_user_groups_group ON login_user_groups(group_id);

ALTER TABLE login_user_groups ENABLE ROW LEVEL SECURITY;

-- Salin group_id lama ke junction (jika belum ada baris junction)
INSERT INTO login_user_groups (user_id, group_id)
SELECT user_id, group_id FROM login
WHERE group_id IS NOT NULL
ON CONFLICT (user_id, group_id) DO NOTHING;

-- Grup "Administrator" mendapat akses penuh menu users (nama grup, bukan UUID tetap)
INSERT INTO group_menu_permissions (group_id, menu_key, can_read, can_create, can_update, can_delete)
SELECT g.group_id, 'users', TRUE, TRUE, TRUE, TRUE
FROM user_groups g
WHERE g.name = 'Administrator'
ON CONFLICT (group_id, menu_key) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_create = EXCLUDED.can_create,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete;

INSERT INTO group_menu_permissions (group_id, menu_key, can_read, can_create, can_update, can_delete)
SELECT g.group_id, 'user_groups', TRUE, TRUE, TRUE, TRUE
FROM user_groups g
WHERE g.name = 'Administrator'
ON CONFLICT (group_id, menu_key) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_create = EXCLUDED.can_create,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete;
