-- ============================================================
-- V5: Add hsk_version to vocabularies table
-- ============================================================

ALTER TABLE vocabularies
    ADD COLUMN IF NOT EXISTS hsk_version VARCHAR(10) NOT NULL DEFAULT 'HSK_2';

-- Index to optimize querying vocabularies by version and level
CREATE INDEX IF NOT EXISTS idx_vocabularies_version_level
    ON vocabularies(hsk_version, hsk_level, sort_order);
