-- Remove CONSUMER from the Role enum.
-- Consumers are identified by their presence in the consumers table, not by a role value.
-- DealerUser.role only applies to dealer staff — CONSUMER was semantically incorrect here.

ALTER TABLE "dealer_users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('DEALER_ADMIN', 'DEALER_STAFF', 'SYSADMIN');
ALTER TABLE "dealer_users" ALTER COLUMN "role" TYPE "Role" USING "role"::text::"Role";
ALTER TABLE "dealer_users" ALTER COLUMN "role" SET DEFAULT 'DEALER_STAFF'::"Role";
DROP TYPE "Role_old";
