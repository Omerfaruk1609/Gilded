-- PostgreSQL Enterprise Range Partitioning Strategy for moderation_logs
-- This script creates a partitioned table by month for 100,000+ scale.

-- 1. Create Partitioned Table
CREATE TABLE IF NOT EXISTS moderation_logs_partitioned (
    id UUID NOT NULL,
    correlation_id VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(100) NOT NULL DEFAULT 'gilded_prod',
    entity_type VARCHAR(100) NOT NULL DEFAULT 'comment',
    entity_id VARCHAR(255),
    text TEXT NOT NULL,
    sanitized_text TEXT NOT NULL,
    verdict VARCHAR(50) NOT NULL,
    risk_score INT NOT NULL,
    violations JSONB NOT NULL,
    breakdown JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 2. Create Monthly Partitions
CREATE TABLE moderation_logs_y2026m07 PARTITION OF moderation_logs_partitioned
    FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');

CREATE TABLE moderation_logs_y2026m08 PARTITION OF moderation_logs_partitioned
    FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');

CREATE TABLE moderation_logs_y2026m09 PARTITION OF moderation_logs_partitioned
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

-- 3. Composite Indexes for High Performance Querying
CREATE INDEX idx_moderation_logs_tenant_entity ON moderation_logs_partitioned (tenant_id, entity_type);
CREATE INDEX idx_moderation_logs_created_at ON moderation_logs_partitioned (created_at DESC);
CREATE INDEX idx_moderation_logs_verdict ON moderation_logs_partitioned (verdict);
