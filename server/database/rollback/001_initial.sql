-- DESTRUCTIVE: use only to remove an unused fresh database after a failed first deployment.
-- For a live database restore a verified pre-migration backup instead.
DROP TABLE IF EXISTS runs;
DROP TABLE IF EXISTS charts;
DROP TABLE IF EXISTS login_tickets;
DROP TABLE IF EXISTS api_tokens;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schema_migrations;
