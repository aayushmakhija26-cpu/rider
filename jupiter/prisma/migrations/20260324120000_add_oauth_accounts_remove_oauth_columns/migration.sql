-- DropIndex
DROP INDEX "dealer_users_oauth_idx";

-- AlterTable: remove old OAuth columns from dealer_users
ALTER TABLE "dealer_users" DROP COLUMN "oauth_provider",
DROP COLUMN "oauth_provider_id";

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" TEXT NOT NULL,
    "dealer_user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique constraint prevents duplicate provider+id pairs
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_id_key" ON "oauth_accounts"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "oauth_accounts_dealer_user_id_idx" ON "oauth_accounts"("dealer_user_id");

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_dealer_user_id_fkey" FOREIGN KEY ("dealer_user_id") REFERENCES "dealer_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
