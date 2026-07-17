ALTER TABLE "HealthPlace" ADD COLUMN "neighborhood" TEXT;
ALTER TABLE "HealthPlace" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "HealthPlace" ADD COLUMN "images" JSONB;

CREATE INDEX "HealthPlace_neighborhood_idx" ON "HealthPlace"("neighborhood");
