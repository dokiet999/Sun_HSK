-- ============================================================
-- V4: Create Vocabulary, Exercise & User Progress tables
-- ============================================================

-- 1. vocabularies (PK = id từ JSON dataset, Long)
CREATE TABLE IF NOT EXISTS vocabularies (
    id                     BIGINT PRIMARY KEY,
    hsk_level              INT NOT NULL,
    lesson_number          INT,
    position               INT,
    hanzi                  VARCHAR(100) NOT NULL,
    pinyin                 VARCHAR(200) NOT NULL,
    han_viet               VARCHAR(200),
    pos                    VARCHAR(50),
    meaning_vi             TEXT NOT NULL,
    meaning_en             TEXT,
    audio_path             TEXT,
    sort_order             INT NOT NULL DEFAULT 0,
    default_in_review_list BOOLEAN NOT NULL DEFAULT FALSE,
    shuffle_rank           DOUBLE PRECISION DEFAULT 0,
    created_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. vocabulary_collocations (parse từ chuỗi "example")
CREATE TABLE IF NOT EXISTS vocabulary_collocations (
    id            BIGSERIAL PRIMARY KEY,
    vocabulary_id BIGINT NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    text          TEXT NOT NULL,
    meaning_vi    TEXT
);

-- 3. vocabulary_examples (từ array "examples")
CREATE TABLE IF NOT EXISTS vocabulary_examples (
    id            BIGSERIAL PRIMARY KEY,
    vocabulary_id BIGINT NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    zh            TEXT NOT NULL,
    vi            TEXT,
    audio_path    TEXT,
    sort_order    INT NOT NULL DEFAULT 0
);

-- 4. exercises (Bảng cha)
CREATE TABLE IF NOT EXISTS exercises (
    id            BIGSERIAL PRIMARY KEY,
    exercise_type VARCHAR(30) NOT NULL,
    hsk_level     INT NOT NULL,
    vocabulary_id BIGINT REFERENCES vocabularies(id) ON DELETE CASCADE,
    example_id    BIGINT REFERENCES vocabulary_examples(id) ON DELETE CASCADE,
    difficulty    INT,
    explanation   TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. fill_blank_exercises (Bảng con - điền từ vào chỗ trống)
CREATE TABLE IF NOT EXISTS fill_blank_exercises (
    id          BIGSERIAL PRIMARY KEY,
    exercise_id BIGINT NOT NULL UNIQUE REFERENCES exercises(id) ON DELETE CASCADE,
    blank_text  TEXT NOT NULL,
    answer      TEXT NOT NULL
);

-- 6. sentence_ordering_exercises (Bảng con - sắp xếp câu)
CREATE TABLE IF NOT EXISTS sentence_ordering_exercises (
    id          BIGSERIAL PRIMARY KEY,
    exercise_id BIGINT NOT NULL UNIQUE REFERENCES exercises(id) ON DELETE CASCADE
);

-- 7. sentence_ordering_tokens (Tokens cho bài tập sắp xếp câu)
CREATE TABLE IF NOT EXISTS sentence_ordering_tokens (
    id          BIGSERIAL PRIMARY KEY,
    exercise_id BIGINT NOT NULL REFERENCES sentence_ordering_exercises(id) ON DELETE CASCADE,
    token       VARCHAR(50) NOT NULL,
    position    INT NOT NULL
);

-- 8. listening_exercises (Bảng con - luyện nghe)
CREATE TABLE IF NOT EXISTS listening_exercises (
    id          BIGSERIAL PRIMARY KEY,
    exercise_id BIGINT NOT NULL UNIQUE REFERENCES exercises(id) ON DELETE CASCADE
);

-- 9. user_vocabularies (Trạng thái và tiến trình học của từng User)
CREATE TABLE IF NOT EXISTS user_vocabularies (
    id               BIGSERIAL PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id    BIGINT NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    status           VARCHAR(20) NOT NULL DEFAULT 'NEW',
    in_review_list   BOOLEAN NOT NULL DEFAULT FALSE,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    next_review_at   TIMESTAMP WITH TIME ZONE,
    review_count     INT NOT NULL DEFAULT 0,
    correct_count    INT NOT NULL DEFAULT 0,
    wrong_count      INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_user_vocab UNIQUE(user_id, vocabulary_id)
);

-- 10. user_exercise_attempts (Lịch sử làm bài tập của user)
CREATE TABLE IF NOT EXISTS user_exercise_attempts (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id     BIGINT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    is_correct      BOOLEAN NOT NULL,
    user_answer     TEXT,
    time_spent_secs INT,
    attempted_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_vocabularies_level        ON vocabularies(hsk_level, sort_order);
CREATE INDEX IF NOT EXISTS idx_vocabularies_level_lesson ON vocabularies(hsk_level, lesson_number, position);
CREATE INDEX IF NOT EXISTS idx_vocab_collocations_vocab  ON vocabulary_collocations(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_vocab_examples_vocab     ON vocabulary_examples(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_exercises_level_type     ON exercises(hsk_level, exercise_type);
CREATE INDEX IF NOT EXISTS idx_exercises_vocab          ON exercises(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_exercises_example        ON exercises(example_id);
CREATE INDEX IF NOT EXISTS idx_user_vocab_user          ON user_vocabularies(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_vocab_review        ON user_vocabularies(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_user_vocab_in_review     ON user_vocabularies(user_id, in_review_list);
CREATE INDEX IF NOT EXISTS idx_user_attempts_user       ON user_exercise_attempts(user_id, attempted_at);
