-- Project Ahang production administrator account.
-- Compatible with the scrypt password format used by server/security.ts.
-- Import this file into the project_ahang database before starting the API.

SET NAMES utf8mb4;
USE `project_ahang`;

START TRANSACTION;

INSERT INTO `users` (
  `id`,
  `username`,
  `password_hash`,
  `nickname`,
  `avatar_url`,
  `role`,
  `status`,
  `last_login_at`
)
VALUES (
  'admin-server',
  'admin',
  'scrypt:05ad25e4dee0a5327b2a6a47efad3fa6:23f08127fad45dba216c508a4e9d94cb5a1ee191c881fae2cb8aec70a274e0fd1f0bda990daecda515404f379e05c8944518e911249a3d5113220a4dd0d46953',
  '阿杭管理员',
  '',
  'admin',
  'active',
  NULL
)
ON DUPLICATE KEY UPDATE
  `username` = VALUES(`username`),
  `password_hash` = VALUES(`password_hash`),
  `nickname` = VALUES(`nickname`),
  `avatar_url` = VALUES(`avatar_url`),
  `role` = VALUES(`role`),
  `status` = VALUES(`status`);

COMMIT;

-- Displays the safe account fields after import. Password hashes and WeChat
-- identifiers are intentionally excluded from the result.
SELECT
  `id`,
  `username`,
  `nickname`,
  `role`,
  `status`,
  `created_at`,
  `last_login_at`
FROM `users`
WHERE `username` = 'admin';
