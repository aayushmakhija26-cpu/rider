-- AlterTable
ALTER TABLE "dealer_users" ADD COLUMN     "oauth_provider" TEXT,
ADD COLUMN     "oauth_provider_id" TEXT;

-- CreateIndex
CREATE INDEX "dealer_users_oauth_idx" ON "dealer_users"("oauth_provider", "oauth_provider_id");
