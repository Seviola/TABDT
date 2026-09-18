CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);  

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_school 
        FOREIGN KEY (school_id) 
        REFERENCES schools(id) 
        ON DELETE SET NULL,

    CONSTRAINT chk_users_role
        CHECK (role IN ('guru', 'orang_tua', 'admin'))
);

CREATE INDEX IF NOT EXISTS idx_users_school_id 
    ON users(school_id);

CREATE INDEX IF NOT EXISTS idx_users_role
    ON users(role);