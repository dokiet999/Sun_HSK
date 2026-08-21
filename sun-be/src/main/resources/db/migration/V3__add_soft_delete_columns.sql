-- ============================================================
-- V3: Add soft delete support for content tables
-- ============================================================

ALTER TABLE exams
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE exam_sections
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE question_options
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;

CREATE INDEX IF NOT EXISTS idx_exams_deleted_at
    ON exams (deleted_at);

CREATE INDEX IF NOT EXISTS idx_exam_sections_deleted_at
    ON exam_sections (deleted_at);

CREATE INDEX IF NOT EXISTS idx_questions_deleted_at
    ON questions (deleted_at);

CREATE INDEX IF NOT EXISTS idx_question_options_deleted_at
    ON question_options (deleted_at);
