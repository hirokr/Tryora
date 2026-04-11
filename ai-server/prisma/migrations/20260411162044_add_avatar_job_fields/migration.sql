/*
  Warnings:

  - You are about to alter the column `body_label` on the `user_profiles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to drop the `generation_jobs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `dress_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "generation_jobs" DROP CONSTRAINT "generation_jobs_user_id_fkey";

-- DropIndex
DROP INDEX "consent_records_user_id_consent_type_idx";

-- DropIndex
DROP INDEX "dress_templates_ethnicity_body_label_idx";

-- AlterTable
ALTER TABLE "dress_templates" ADD COLUMN     "glb_source" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP NOT NULL,
ALTER COLUMN "glb_s3_key" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP NOT NULL,
ALTER COLUMN "body_label" SET DATA TYPE VARCHAR(50);

-- DropTable
DROP TABLE "generation_jobs";

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStage" TEXT,
    "tripoTaskId" TEXT,
    "inputS3Key" TEXT,
    "outputGlbS3Key" TEXT,
    "outputGlbRedisKey" TEXT,
    "templateDressId" TEXT,
    "userImageS3Key" TEXT,
    "glbSource" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consent_records_user_id_created_at_idx" ON "consent_records"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "dress_templates_ethnicity_body_label_is_active_idx" ON "dress_templates"("ethnicity", "body_label", "is_active");

-- RenameForeignKey
ALTER TABLE "consent_records" RENAME CONSTRAINT "consent_records_user_id_fkey" TO "consent_user_fkey";

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_profile_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
