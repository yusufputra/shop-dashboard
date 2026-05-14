-- RBAC: grup pengguna + izin per menu (CRUD)
-- Jalankan setelah add_email_to_login / schema login yang ada.

CREATE TABLE IF NOT EXISTS user_groups (
  group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_menu_permissions (
  group_id UUID NOT NULL REFERENCES user_groups(group_id) ON DELETE CASCADE,
  menu_key VARCHAR(64) NOT NULL,
  can_read BOOLEAN NOT NULL DEFAULT FALSE,
  can_create BOOLEAN NOT NULL DEFAULT FALSE,
  can_update BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (group_id, menu_key)
);

ALTER TABLE login
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES user_groups(group_id) ON DELETE SET NULL;
ALTER TABLE login
  ADD COLUMN IF NOT EXISTS is_superuser BOOLEAN NOT NULL DEFAULT FALSE;

-- Hanya service_role yang mengelola RBAC dari app server (opsional: buka baca ke authenticated nanti)
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_menu_permissions ENABLE ROW LEVEL SECURITY;

-- Grup bawaan + izin penuh (UUID tetap agar mudah direferensi di migrasi/data)
INSERT INTO user_groups (group_id, name, description) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Administrator', 'Akses penuh semua menu')
ON CONFLICT (name) DO NOTHING;

INSERT INTO group_menu_permissions (group_id, menu_key, can_read, can_create, can_update, can_delete) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'dashboard', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'inventory', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'sales', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'purchases', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'orders', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'calculator', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'users', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'user_groups', TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (group_id, menu_key) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_create = EXCLUDED.can_create,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete;

-- Pengguna lama tanpa grup → Administrator (ubah jika ingin grup lain)
UPDATE login
SET group_id = 'a0000000-0000-0000-0000-000000000001'
WHERE group_id IS NULL;

-- Banyak grup per pengguna
CREATE TABLE IF NOT EXISTS login_user_groups (
  user_id UUID NOT NULL REFERENCES login(user_id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES user_groups(group_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_login_user_groups_user ON login_user_groups(user_id);

ALTER TABLE login_user_groups ENABLE ROW LEVEL SECURITY;

INSERT INTO login_user_groups (user_id, group_id)
SELECT user_id, group_id FROM login
WHERE group_id IS NOT NULL
ON CONFLICT (user_id, group_id) DO NOTHING;
