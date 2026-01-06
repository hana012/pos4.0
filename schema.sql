-- PostgreSQL Database Schema for POS System Backups
-- Run this SQL to create the backup table in your PostgreSQL database

-- Create backups table
CREATE TABLE IF NOT EXISTS sonic_backups (
    id SERIAL PRIMARY KEY,
    backup_name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version VARCHAR(50) DEFAULT '1.0',
    backup_data JSONB NOT NULL,
    data_size BIGINT,
    created_by VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_sonic_backups_timestamp ON sonic_backups(timestamp DESC);

-- Create index on backup_name
CREATE INDEX IF NOT EXISTS idx_sonic_backups_name ON sonic_backups(backup_name);

-- Add comment to table
COMMENT ON TABLE sonic_backups IS 'Stores complete POS system backups in JSONB format';
COMMENT ON COLUMN sonic_backups.backup_data IS 'JSONB containing all system data (invoices, items, customers, etc.)';
COMMENT ON COLUMN sonic_backups.data_size IS 'Size of backup data in bytes';

