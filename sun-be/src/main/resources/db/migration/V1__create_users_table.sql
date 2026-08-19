-- ============================================================
-- V1: Create users table
-- ============================================================
CREATE TABLE IF NOT EXISTS users
(
    id             UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    email          VARCHAR(255) NOT NULL UNIQUE,
    username       VARCHAR(100) UNIQUE,
    password_hash  VARCHAR(255),                          -- null khi dùng OAuth2
    display_name   VARCHAR(255),
    avatar_url     TEXT,
    role           VARCHAR(20)  NOT NULL    DEFAULT 'USER',
    auth_provider  VARCHAR(20)  NOT NULL    DEFAULT 'LOCAL',
    provider_id    VARCHAR(255),                          -- Google sub ID
    email_verified BOOLEAN      NOT NULL    DEFAULT FALSE,
    active         BOOLEAN      NOT NULL    DEFAULT TRUE,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index tìm kiếm theo email (dùng trong login, OAuth2 lookup)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Index tìm kiếm theo provider (OAuth2 user lookup)
CREATE INDEX IF NOT EXISTS idx_users_provider ON users (auth_provider, provider_id);

-- ============================================================
-- Seed: Default admin account (password: Admin@123)
-- BCrypt hash của "Admin@123"
-- ============================================================
INSERT INTO users (email, username, password_hash, display_name, role, auth_provider, email_verified, active)
VALUES ('admin@sunhsk.com',
        'admin',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCkgQKjDw7k9WUoAqc/nGEa',
        'Sun-HSK Admin',
        'ADMIN',
        'LOCAL',
        TRUE,
        TRUE)
ON CONFLICT (email) DO NOTHING;
