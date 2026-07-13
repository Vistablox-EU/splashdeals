-- Normalize city names from "Belgrade" to "Beograd"
UPDATE "partners"."Facility" SET city = 'Beograd' WHERE city = 'Belgrade';
