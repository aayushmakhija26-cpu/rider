-- Restore CONSUMER to the Role enum so the replayed migration history matches
-- the current Prisma schema and application code.
ALTER TYPE "Role" ADD VALUE 'CONSUMER';
