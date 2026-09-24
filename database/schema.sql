-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. CATEGORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS categories (
    category_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#0d6efd', -- Hex color for UI badges
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Pre-seeded standard categories
INSERT INTO categories (name, color, description) VALUES
    ('Study', '#0d6efd', 'Academic studies, homework, revisions'),
    ('College', '#6f42c1', 'Lectures, labs, submissions, college events'),
    ('Exercise', '#198754', 'Gym, workouts, sports, running'),
    ('Personal', '#0dcaf0', 'Habits, chores, reading, errands'),
    ('Work', '#fd7e14', 'Part-time jobs, projects, internships'),
    ('Other', '#6c757d', 'Miscellaneous tasks')
ON CONFLICT (name) DO NOTHING;

-- ==============================================================================
-- 3. ACTIVITIES TABLE (Core Entity)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS activities (
    activity_id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' 
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    status VARCHAR(15) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'COMPLETED')),
    category_id BIGINT REFERENCES categories(category_id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_time_window CHECK (start_time IS NULL OR end_time IS NULL OR start_time <= end_time)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category_id);
CREATE INDEX IF NOT EXISTS idx_activities_date_status ON activities(activity_date, status);

-- Trigger to automatically update updated_at on record changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_activities_updated_at ON activities;
CREATE TRIGGER trigger_activities_updated_at
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 4. RECURRING ACTIVITIES TABLE (Phase 3 Feature)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS recurring_activities (
    recurring_id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    start_time TIME,
    end_time TIME,
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' 
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    category_id BIGINT REFERENCES categories(category_id) ON DELETE SET NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'DAILY' 
        CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')),
    days_of_week VARCHAR(30), -- e.g. 'MON,WED,FRI'
    start_date DATE NOT NULL,
    end_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_recurring_dates CHECK (end_date IS NULL OR start_date <= end_date)
);

CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_activities(active);

