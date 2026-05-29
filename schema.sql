-- Ideal DuckDB Schema for Candidate Matching System
-- Run this once to create tables, then populate via ETL

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    job_id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT,
    location TEXT,
    employment_type TEXT,  -- full-time, part-time, contract
    experience_level TEXT,  -- entry, mid, senior, executive
    salary_min DECIMAL,
    salary_max DECIMAL,
    description TEXT,
    required_skills TEXT[],  -- Array of skill names
    preferred_skills TEXT[],
    posted_date DATE,
    status TEXT DEFAULT 'active',  -- active, closed, on-hold
    source TEXT,  -- linkedin, indeed, internal, etc.
    external_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    candidate_id INTEGER PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    current_title TEXT,
    current_company TEXT,
    years_experience INTEGER,
    experience_level TEXT,  -- entry, mid, senior, executive
    skills TEXT[],  -- Array of skill names
    education_level TEXT,  -- high-school, bachelor, master, phd
    education_field TEXT,
    availability TEXT,  -- immediate, 2-weeks, 1-month, not-looking
    salary_expectation_min DECIMAL,
    salary_expectation_max DECIMAL,
    resume_url TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    source TEXT,  -- applied, referred, sourced, agency
    status TEXT DEFAULT 'active',  -- active, placed, archived
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidate work history (for detailed matching)
CREATE TABLE IF NOT EXISTS candidate_experience (
    id INTEGER PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(candidate_id),
    company TEXT,
    title TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    skills_used TEXT[]
);

-- Candidate notes (stored client-side in browser localStorage for static site)
-- This table is optional - only used if you add backend later
CREATE TABLE IF NOT EXISTS candidate_notes (
    note_id INTEGER PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(candidate_id),
    job_id INTEGER REFERENCES jobs(job_id),
    user_email TEXT,
    note_text TEXT NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),  -- Optional 1-5 star rating
    tags TEXT[],  -- e.g., ['strong-culture-fit', 'salary-concern', 'urgent']
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job-Candidate matching scores (pre-computed or cached)
CREATE TABLE IF NOT EXISTS match_scores (
    id INTEGER PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(candidate_id),
    job_id INTEGER REFERENCES jobs(job_id),
    overall_score DECIMAL,  -- 0-100
    skills_match_score DECIMAL,  -- 0-100
    experience_match_score DECIMAL,  -- 0-100
    level_match_score DECIMAL,  -- 0-100
    location_match_score DECIMAL,  -- 0-100
    salary_match_score DECIMAL,  -- 0-100
    matched_skills TEXT[],  -- Skills that overlap
    missing_skills TEXT[],  -- Required skills candidate lacks
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster matching queries
CREATE INDEX IF NOT EXISTS idx_candidates_skills ON candidates USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON jobs USING GIN (required_skills);
CREATE INDEX IF NOT EXISTS idx_candidates_level ON candidates(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_match_scores_candidate ON match_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_job ON match_scores(job_id);
