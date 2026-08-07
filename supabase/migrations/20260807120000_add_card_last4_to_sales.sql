-- ============================================================================
-- ApparelSync-CRM — Migration: Add card_last4 to sales table
-- Stores last 4 digits of credit card for reference (display only, no validation)
-- ============================================================================

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS card_last4 TEXT;