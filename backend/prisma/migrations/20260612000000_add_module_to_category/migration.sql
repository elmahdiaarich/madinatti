-- Migration: add_module_to_category
-- Strategy:
--   1. Add `module` column with a temporary default so existing rows don't violate NOT NULL
--   2. Drop the old parentId FK and self-relation
--   3. Drop the temporary default (column remains NOT NULL)
-- After this migration, run `npx prisma db seed` to repopulate categories with correct module values.

-- Step 1: Add `module` with a temporary default for existing rows
ALTER TABLE "Category" ADD COLUMN "module" TEXT NOT NULL DEFAULT 'legacy';

-- Step 2: Remove the parentId foreign-key self-reference and the column itself
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_parentId_fkey";
ALTER TABLE "Category" DROP COLUMN IF EXISTS "parentId";

-- Step 3: Remove the temporary default (column stays NOT NULL — new inserts must supply a value)
ALTER TABLE "Category" ALTER COLUMN "module" DROP DEFAULT;
