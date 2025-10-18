/*
  Warnings:

  - You are about to drop the column `doses` on the `Survey` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Survey" DROP COLUMN "doses",
ADD COLUMN     "alarmModalAcknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "appVersion" TEXT,
ADD COLUMN     "deviceInfo" JSONB,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "platform" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "totalAlarmsDismissed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalAlarmsSet" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalAlarmsSnoozed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalDosesCreated" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalDosesTaken" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPageViews" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Dose" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "dosageUnit" TEXT NOT NULL,
    "form" TEXT,
    "notes" TEXT,
    "frequency" TEXT NOT NULL,
    "timesPerDay" INTEGER,
    "specificDays" JSONB,
    "scheduledTimes" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "totalTaken" INTEGER NOT NULL DEFAULT 0,
    "totalMissed" INTEGER NOT NULL DEFAULT 0,
    "lastTakenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoseHistory" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "doseId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledTime" TEXT,
    "actualTime" TEXT,
    "takenOnTime" BOOLEAN,
    "delayMinutes" INTEGER,
    "source" TEXT,
    "notes" TEXT,
    "metadata" JSONB,

    CONSTRAINT "DoseHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavEvent" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "routeFrom" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "exitTimestamp" TIMESTAMP(3),
    "deviceType" TEXT,
    "screenSize" TEXT,
    "viewportSize" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "language" TEXT,
    "timezone" TEXT,
    "sessionId" TEXT,
    "scrollDepth" INTEGER,
    "clickCount" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "NavEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageTiming" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" TIMESTAMP(3),
    "timeSpent" INTEGER,
    "loadTime" INTEGER,
    "timeToInteractive" INTEGER,
    "interactions" INTEGER NOT NULL DEFAULT 0,
    "scrollDepthMax" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "PageTiming_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "elementText" TEXT,
    "page" TEXT NOT NULL,
    "value" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xPosition" INTEGER,
    "yPosition" INTEGER,
    "sessionId" TEXT,
    "duration" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlarmInteraction" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "doseId" TEXT,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledTime" TEXT,
    "actualTime" TEXT,
    "responseTime" INTEGER,
    "snoozeDuration" INTEGER,
    "snoozeCount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT,
    "deviceState" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AlarmInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "easeOfUse" INTEGER,
    "clarityOfInstructions" INTEGER,
    "perceivedSpeed" INTEGER,
    "confidenceInUse" INTEGER,
    "intentionToUse" INTEGER,
    "missingFeatures" TEXT,
    "additionalComments" TEXT,
    "overallRating" INTEGER,
    "nps" INTEGER,
    "category" TEXT,
    "tags" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeToComplete" INTEGER,
    "appVersion" TEXT,
    "source" TEXT,
    "contactAllowed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT,
    "errorType" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "errorStack" TEXT,
    "page" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "componentStack" TEXT,
    "userActions" JSONB,
    "severity" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoseHistory_surveyId_doseId_idx" ON "DoseHistory"("surveyId", "doseId");

-- CreateIndex
CREATE INDEX "DoseHistory_timestamp_idx" ON "DoseHistory"("timestamp");

-- CreateIndex
CREATE INDEX "NavEvent_surveyId_route_idx" ON "NavEvent"("surveyId", "route");

-- CreateIndex
CREATE INDEX "NavEvent_timestamp_idx" ON "NavEvent"("timestamp");

-- CreateIndex
CREATE INDEX "PageTiming_surveyId_page_idx" ON "PageTiming"("surveyId", "page");

-- CreateIndex
CREATE INDEX "PageTiming_enteredAt_idx" ON "PageTiming"("enteredAt");

-- CreateIndex
CREATE INDEX "Interaction_surveyId_type_idx" ON "Interaction"("surveyId", "type");

-- CreateIndex
CREATE INDEX "Interaction_timestamp_idx" ON "Interaction"("timestamp");

-- CreateIndex
CREATE INDEX "AlarmInteraction_surveyId_action_idx" ON "AlarmInteraction"("surveyId", "action");

-- CreateIndex
CREATE INDEX "AlarmInteraction_timestamp_idx" ON "AlarmInteraction"("timestamp");

-- CreateIndex
CREATE INDEX "Feedback_surveyId_idx" ON "Feedback"("surveyId");

-- CreateIndex
CREATE INDEX "Feedback_timestamp_idx" ON "Feedback"("timestamp");

-- CreateIndex
CREATE INDEX "ErrorLog_surveyId_idx" ON "ErrorLog"("surveyId");

-- CreateIndex
CREATE INDEX "ErrorLog_timestamp_idx" ON "ErrorLog"("timestamp");

-- CreateIndex
CREATE INDEX "ErrorLog_errorType_idx" ON "ErrorLog"("errorType");

-- AddForeignKey
ALTER TABLE "Dose" ADD CONSTRAINT "Dose_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoseHistory" ADD CONSTRAINT "DoseHistory_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoseHistory" ADD CONSTRAINT "DoseHistory_doseId_fkey" FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavEvent" ADD CONSTRAINT "NavEvent_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageTiming" ADD CONSTRAINT "PageTiming_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlarmInteraction" ADD CONSTRAINT "AlarmInteraction_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlarmInteraction" ADD CONSTRAINT "AlarmInteraction_doseId_fkey" FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
