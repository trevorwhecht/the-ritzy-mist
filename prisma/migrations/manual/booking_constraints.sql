-- Booking constraints (Phase 0, Task 2 Step 7).
--
-- These statements are NOT applied automatically. After running
--   npx prisma migrate dev --create-only --name booking_constraints
-- paste the contents of this file into the generated
--   prisma/migrations/<timestamp>_booking_constraints/migration.sql
-- and then run `npx prisma migrate dev` to apply it.
--
-- If the host rejects `CREATE EXTENSION`, delete the first two statements, keep the
-- CHECK, and note in the spec that Phase 2's booking transaction must use
--   SELECT pg_advisory_xact_lock(hashtext('appointments'))
-- before inserting.

CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (tstzrange("startAt", "endAt") WITH &&) WHERE (status = 'BOOKED');
ALTER TABLE "User" ADD CONSTRAINT user_skin_type_range
  CHECK ("skinType" IS NULL OR "skinType" BETWEEN 1 AND 6);
