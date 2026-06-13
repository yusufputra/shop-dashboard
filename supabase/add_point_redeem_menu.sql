-- Menu RBAC terpisah untuk halaman Redeem poin
-- Fresh install: sudah termasuk di schema.sql
-- Database lama: jalankan file ini sekali

INSERT INTO group_menu_permissions (group_id, menu_key, can_read, can_create, can_update, can_delete)
SELECT g.group_id, 'point_redeem', TRUE, TRUE, TRUE, TRUE
FROM user_groups g
WHERE g.name = 'Administrator'
ON CONFLICT (group_id, menu_key) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_create = EXCLUDED.can_create,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete;
