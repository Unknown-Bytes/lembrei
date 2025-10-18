-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "doseCreationCompletedAt" TIMESTAMP(3),
ADD COLUMN     "doses" JSONB,
ADD COLUMN     "dosesAdded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firstTimeEnteringDoseCreationArea" TIMESTAMP(3),
ADD COLUMN     "userEvents" JSONB;
