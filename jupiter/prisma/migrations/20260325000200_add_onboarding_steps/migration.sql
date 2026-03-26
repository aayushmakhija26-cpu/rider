-- CreateEnum OnboardingStatus
CREATE TYPE "OnboardingStatus" AS ENUM ('pending', 'active', 'complete', 'skipped');

-- CreateTable OnboardingStep
CREATE TABLE "onboarding_steps" (
    "id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'pending',
    "data" JSONB,
    "completed_at" TIMESTAMP(3),
    "skipped_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "onboarding_steps_dealer_id_idx" ON "onboarding_steps"("dealer_id");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_steps_dealer_id_stepName_key" ON "onboarding_steps"("dealer_id", "stepName");

-- AddForeignKey
ALTER TABLE "onboarding_steps" ADD CONSTRAINT "onboarding_steps_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
