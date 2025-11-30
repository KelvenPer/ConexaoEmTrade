-- Normaliza valores nulos para setor e aplica default/not null
UPDATE "TBLACCESSPOLICY" SET "sector" = 'GLOBAL' WHERE "sector" IS NULL;

ALTER TABLE "TBLACCESSPOLICY"
  ALTER COLUMN "sector" SET DEFAULT 'GLOBAL',
  ALTER COLUMN "sector" SET NOT NULL;
