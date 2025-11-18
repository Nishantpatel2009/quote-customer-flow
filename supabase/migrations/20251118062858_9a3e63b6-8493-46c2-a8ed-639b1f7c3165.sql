-- Add quantity column to quote_items table
ALTER TABLE quote_items ADD COLUMN quantity integer DEFAULT 1 NOT NULL;