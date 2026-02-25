-- Fix total_time column type in field_employee_attendance table
-- This migration ensures total_time is NUMERIC(10,4) to support decimal hours
-- If the column is INTEGER, it will be altered to NUMERIC(10,4)

-- Check if column exists and alter its type
DO $$
BEGIN
    -- Check if the column exists and is not already NUMERIC(10,4)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'field_employee_attendance' 
        AND column_name = 'total_time'
        AND data_type != 'numeric'
    ) THEN
        -- Alter the column to NUMERIC(10,4)
        ALTER TABLE field_employee_attendance
        ALTER COLUMN total_time TYPE NUMERIC(10,4) USING total_time::NUMERIC(10,4);
        
        RAISE NOTICE 'Altered total_time column to NUMERIC(10,4)';
    ELSIF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'field_employee_attendance' 
        AND column_name = 'total_time'
        AND data_type = 'numeric'
    ) THEN
        -- Column is already NUMERIC, but ensure it's (10,4)
        ALTER TABLE field_employee_attendance
        ALTER COLUMN total_time TYPE NUMERIC(10,4) USING total_time::NUMERIC(10,4);
        
        RAISE NOTICE 'Ensured total_time column is NUMERIC(10,4)';
    ELSE
        -- Column doesn't exist, create it
        ALTER TABLE field_employee_attendance
        ADD COLUMN total_time NUMERIC(10,4);
        
        RAISE NOTICE 'Created total_time column as NUMERIC(10,4)';
    END IF;
END $$;

