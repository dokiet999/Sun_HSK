-- ============================================================
-- V2: Exam System tables
-- ============================================================

-- ============================================================
-- Đề thi
-- ============================================================
CREATE TABLE IF NOT EXISTS exams
(
    id              UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    hsk_version     VARCHAR(10)  NOT NULL,
    hsk_level       INT          NOT NULL,
    exam_type       VARCHAR(30)  NOT NULL,
    time_limit      INT          NOT NULL,
    total_questions INT          NOT NULL    DEFAULT 0,
    total_points    INT          NOT NULL    DEFAULT 0,
    passing_score   INT          NOT NULL    DEFAULT 60,
    status          VARCHAR(20)  NOT NULL    DEFAULT 'DRAFT',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Phần thi (Nghe / Đọc / Viết)
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_sections
(
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id      UUID        NOT NULL REFERENCES exams (id) ON DELETE CASCADE,
    section_type VARCHAR(30) NOT NULL,
    title        VARCHAR(255),
    instructions TEXT,
    time_limit   INT,
    sort_order   INT         NOT NULL DEFAULT 0
);

-- ============================================================
-- Câu hỏi
-- ============================================================
CREATE TABLE IF NOT EXISTS questions
(
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id     UUID        NOT NULL REFERENCES exam_sections (id) ON DELETE CASCADE,
    question_type  VARCHAR(30) NOT NULL,
    content        TEXT,
    audio_url      TEXT,
    image_url      TEXT,
    points         INT         NOT NULL DEFAULT 1,
    sort_order     INT         NOT NULL DEFAULT 0,
    explanation    TEXT,
    correct_answer TEXT
);

-- ============================================================
-- Lựa chọn đáp án
-- ============================================================
CREATE TABLE IF NOT EXISTS question_options
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID         NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    content     TEXT         NOT NULL,
    image_url   TEXT,
    is_correct  BOOLEAN      NOT NULL DEFAULT FALSE,
    match_key   VARCHAR(50),
    sort_order  INT          NOT NULL DEFAULT 0
);

-- ============================================================
-- Lần làm bài của user
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_attempts
(
    id               UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    user_id          UUID           NOT NULL REFERENCES users (id),
    exam_id          UUID           NOT NULL REFERENCES exams (id),
    status           VARCHAR(20)    NOT NULL   DEFAULT 'IN_PROGRESS',
    started_at       TIMESTAMP WITH TIME ZONE  DEFAULT NOW(),
    submitted_at     TIMESTAMP WITH TIME ZONE,
    expires_at       TIMESTAMP WITH TIME ZONE,
    time_spent_secs  INT,
    total_score      INT                       DEFAULT 0,
    total_points     INT                       DEFAULT 0,
    score_percent    DECIMAL(5, 2)             DEFAULT 0,
    passed           BOOLEAN                   DEFAULT FALSE,
    listening_score  INT                       DEFAULT 0,
    reading_score    INT                       DEFAULT 0,
    writing_score    INT                       DEFAULT 0
);

-- ============================================================
-- Câu trả lời của user
-- ============================================================
CREATE TABLE IF NOT EXISTS attempt_answers
(
    id                 UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    attempt_id         UUID NOT NULL REFERENCES exam_attempts (id) ON DELETE CASCADE,
    question_id        UUID NOT NULL REFERENCES questions (id),
    selected_option_id UUID REFERENCES question_options (id),
    text_answer        TEXT,
    match_pairs        TEXT,
    order_answer       TEXT,
    is_correct         BOOLEAN,
    points_earned      INT                      DEFAULT 0,
    answered_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (attempt_id, question_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON exam_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts (exam_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers (attempt_id);
CREATE INDEX IF NOT EXISTS idx_questions_section ON questions (section_id);
CREATE INDEX IF NOT EXISTS idx_exams_level ON exams (hsk_version, hsk_level, status);
CREATE INDEX IF NOT EXISTS idx_exam_sections_exam ON exam_sections (exam_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options (question_id);
