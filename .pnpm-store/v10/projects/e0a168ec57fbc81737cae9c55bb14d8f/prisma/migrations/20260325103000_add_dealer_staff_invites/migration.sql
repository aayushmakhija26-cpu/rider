-- AlterTable
ALTER TABLE "dealer_users"
ADD COLUMN "invite_token_hash" TEXT,
ADD COLUMN "invite_expires_at" TIMESTAMP(3),
ADD COLUMN "invited_at" TIMESTAMP(3),
ADD COLUMN "accepted_at" TIMESTAMP(3),
ADD COLUMN "deactivated_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "dealer_users_invite_token_hash_key"
ON "dealer_users"("invite_token_hash");

-- CreateIndex
CREATE INDEX "dealer_users_dealer_id_deactivated_at_idx"
ON "dealer_users"("dealer_id", "deactivated_at");
