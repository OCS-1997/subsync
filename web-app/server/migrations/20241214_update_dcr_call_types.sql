-- Update call_type enum to support new values (incoming, outgoing, follow-up)
START TRANSACTION;

-- Step 1: Add a temporary column
ALTER TABLE dcr_entries ADD COLUMN call_type_new ENUM('incoming', 'outgoing', 'follow-up') NULL AFTER call_type;

-- Step 2: Copy data with mapping from old to new values
UPDATE dcr_entries 
SET call_type_new = CASE 
    WHEN call_type = 'inbound' THEN 'incoming'
    WHEN call_type = 'outbound' THEN 'outgoing'
    ELSE 'incoming'
END;

-- Step 3: Drop old column
ALTER TABLE dcr_entries DROP COLUMN call_type;

-- Step 4: Rename new column to call_type
ALTER TABLE dcr_entries CHANGE COLUMN call_type_new call_type ENUM('incoming', 'outgoing', 'follow-up') NOT NULL DEFAULT 'incoming';

COMMIT;
