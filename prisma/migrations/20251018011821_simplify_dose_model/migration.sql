/*
  Warnings:

  - You are about to drop the column `dosage` on the `Dose` table. All the data in the column will be lost.
  - You are about to drop the column `dosageUnit` on the `Dose` table. All the data in the column will be lost.
  - You are about to drop the column `form` on the `Dose` table. All the data in the column will be lost.
  - You are about to drop the column `medicationName` on the `Dose` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledTimes` on the `Dose` table. All the data in the column will be lost.
  - You are about to drop the column `specificDays` on the `Dose` table. All the data in the column will be lost.
  - You are about to drop the column `timesPerDay` on the `Dose` table. All the data in the column will be lost.
  - Added the required column `name` to the `Dose` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `Dose` table without a default value. This is not possible if the table is not empty.
  - Made the column `notes` on table `Dose` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Dose" DROP COLUMN "dosage",
DROP COLUMN "dosageUnit",
DROP COLUMN "form",
DROP COLUMN "medicationName",
DROP COLUMN "scheduledTimes",
DROP COLUMN "specificDays",
DROP COLUMN "timesPerDay",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "selectedDays" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "time" TEXT NOT NULL,
ALTER COLUMN "notes" SET NOT NULL,
ALTER COLUMN "notes" SET DEFAULT '',
ALTER COLUMN "startDate" SET DATA TYPE TEXT,
ALTER COLUMN "endDate" SET DATA TYPE TEXT;
