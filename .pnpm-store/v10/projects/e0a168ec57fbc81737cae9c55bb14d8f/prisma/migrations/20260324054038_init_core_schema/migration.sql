-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DEALER_ADMIN', 'DEALER_STAFF', 'CONSUMER', 'SYSADMIN');

-- CreateTable
CREATE TABLE "dealers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "logo_url" TEXT,
    "primary_colour" TEXT,
    "secondary_colour" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "website_url" TEXT,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_product_id" TEXT,
    "plan_name" TEXT,
    "subscription_status" TEXT,
    "simulation_mode" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_users" (
    "id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'DEALER_STAFF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumers" (
    "id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "email_opt_out" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consumers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dealers_email_key" ON "dealers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dealers_stripe_customer_id_key" ON "dealers"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "dealers_stripe_subscription_id_key" ON "dealers"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "dealer_users_dealer_id_idx" ON "dealer_users"("dealer_id");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_users_dealer_id_email_key" ON "dealer_users"("dealer_id", "email");

-- CreateIndex
CREATE INDEX "consumers_dealer_id_idx" ON "consumers"("dealer_id");

-- CreateIndex
CREATE UNIQUE INDEX "consumers_dealer_id_email_key" ON "consumers"("dealer_id", "email");

-- AddForeignKey
ALTER TABLE "dealer_users" ADD CONSTRAINT "dealer_users_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumers" ADD CONSTRAINT "consumers_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
