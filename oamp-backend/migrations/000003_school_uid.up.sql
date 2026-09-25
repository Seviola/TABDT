ALTER TABLE schools
ADD COLUMN code VARCHAR(10),
ADD COLUMN uid_counter INTEGER NOT NULL DEFAULT 0;

UPDATE schools
SET code = 'IT'
WHERE name = 'SDIT Al Uswah Surabaya';

UPDATE schools
SET code = 'SM'
WHERE name = 'SDN Menur Pumpungan IV';

ALTER TABLE schools
ALTER COLUMN code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_code
ON schools(code);