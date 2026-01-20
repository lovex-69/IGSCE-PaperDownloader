-- ============================================================================
-- IGCSE on Fingertips - Supabase Database Schema
-- Run this in the Supabase SQL Editor to create all tables
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STUDENTS TABLE
-- Stores student details collected before paper access
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    mobile TEXT,
    subjects TEXT[] DEFAULT '{}',
    student_type TEXT DEFAULT 'private' CHECK (student_type IN ('school', 'private')),
    consent BOOLEAN NOT NULL DEFAULT false,
    device_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    papers_accessed INTEGER DEFAULT 0
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- ============================================================================
-- PAPERS TABLE
-- Stores paper metadata (admin-uploaded or external)
-- ============================================================================
CREATE TABLE IF NOT EXISTS papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_code TEXT NOT NULL,
    subject_name TEXT,
    paper_code TEXT NOT NULL,
    year INTEGER NOT NULL,
    session TEXT NOT NULL CHECK (session IN ('m', 's', 'w')),
    paper_type TEXT NOT NULL CHECK (paper_type IN ('qp', 'ms', 'er')),
    variant TEXT DEFAULT '',
    file_url TEXT,
    source TEXT DEFAULT 'external' CHECK (source IN ('admin', 'external')),
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'restricted')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for paper lookups
CREATE INDEX IF NOT EXISTS idx_papers_subject_year ON papers(subject_code, year);

-- ============================================================================
-- QUESTIONS TABLE
-- Stores extracted questions from papers (for question-based search)
-- ============================================================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id UUID REFERENCES papers(id) ON DELETE CASCADE,
    question_number TEXT,
    question_text TEXT NOT NULL,
    topic TEXT,
    marks INTEGER,
    search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', question_text)) STORED
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_questions_search ON questions USING GIN(search_vector);

-- ============================================================================
-- ACCESS_LOGS TABLE
-- Tracks paper views and downloads for analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    paper_id UUID REFERENCES papers(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('view', 'download')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_access_logs_student ON access_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_paper ON access_logs(paper_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_date ON access_logs(created_at);

-- ============================================================================
-- HELPER FUNCTION: Increment papers_accessed
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_papers_accessed(student_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    UPDATE students 
    SET papers_accessed = papers_accessed + 1,
        last_accessed_at = NOW()
    WHERE id = student_uuid
    RETURNING papers_accessed INTO current_count;
    
    RETURN current_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write for students (for app registration)
CREATE POLICY "Allow anonymous student operations" ON students
    FOR ALL USING (true) WITH CHECK (true);

-- Allow anonymous read for papers
CREATE POLICY "Allow anonymous paper reads" ON papers
    FOR SELECT USING (visibility = 'public');

-- Allow anonymous read for questions
CREATE POLICY "Allow anonymous question reads" ON questions
    FOR SELECT USING (true);

-- Allow anonymous insert for access logs
CREATE POLICY "Allow anonymous access log inserts" ON access_logs
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- SAMPLE DATA (Optional - uncomment to add sample questions)
-- ============================================================================

/*
-- Sample paper
INSERT INTO papers (subject_code, subject_name, paper_code, year, session, paper_type, variant)
VALUES ('0625', 'Physics', '22', 2023, 's', 'qp', '2');

-- Sample questions (replace paper_id with actual UUID)
INSERT INTO questions (paper_id, question_number, question_text, topic, marks)
VALUES 
    ((SELECT id FROM papers LIMIT 1), '1', 'Calculate the resistance of a wire if V = 12V and I = 2A', 'Electricity', 2),
    ((SELECT id FROM papers LIMIT 1), '2', 'State the principle of conservation of energy', 'Energy', 2),
    ((SELECT id FROM papers LIMIT 1), '3', 'Define acceleration and state its SI unit', 'Kinematics', 2);
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('students', 'papers', 'questions', 'access_logs');
