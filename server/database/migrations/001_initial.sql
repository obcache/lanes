-- MySQL 8.0+ / MariaDB 10.6+. Back up before applying. Run once on an empty LANES database.
CREATE TABLE schema_migrations (version INT PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE users (
 id CHAR(32) PRIMARY KEY, issuer VARCHAR(500) COLLATE utf8mb4_bin NOT NULL, subject VARCHAR(255) COLLATE utf8mb4_bin NOT NULL,
 display_name VARCHAR(60) NOT NULL, role VARCHAR(16) NOT NULL,
 background_asset CHAR(64) NULL, lane_asset CHAR(64) NULL, created_at BIGINT NOT NULL,
 UNIQUE KEY identity_subject (issuer,subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE api_tokens (token_hash CHAR(64) PRIMARY KEY,user_id CHAR(32) NOT NULL,expires_at BIGINT NOT NULL,INDEX(expires_at),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB;
CREATE TABLE login_tickets (code_hash CHAR(64) PRIMARY KEY,user_id CHAR(32) NOT NULL,challenge VARCHAR(128) NOT NULL,expires_at BIGINT NOT NULL,INDEX(expires_at),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB;
CREATE TABLE charts (
 chart_hash CHAR(64) PRIMARY KEY,track_id VARCHAR(80) NOT NULL,title VARCHAR(200) NOT NULL,artist VARCHAR(200) NOT NULL,
 duration DOUBLE NOT NULL,difficulty VARCHAR(16) NOT NULL,note_count INT NOT NULL,chart_json MEDIUMTEXT NOT NULL,
 INDEX track_difficulty(track_id,difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE runs (
 id CHAR(36) PRIMARY KEY,user_id CHAR(32) NOT NULL,chart_hash CHAR(64) NOT NULL,track_id VARCHAR(80) NOT NULL,
 difficulty VARCHAR(16) NOT NULL,total INT NOT NULL,perfect INT NOT NULL,good INT NOT NULL,miss INT NOT NULL,
 max_combo INT NOT NULL,score INT NOT NULL,accuracy DECIMAL(5,2) NOT NULL,submitted_at BIGINT NOT NULL,
 INDEX leaderboard(track_id,difficulty,chart_hash,score),INDEX user_time(user_id,submitted_at),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(chart_hash) REFERENCES charts(chart_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO schema_migrations(version) VALUES(1);
