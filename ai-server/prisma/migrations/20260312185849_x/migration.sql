-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "meas_height" DOUBLE PRECISION,
    "meas_chest" DOUBLE PRECISION,
    "meas_waist" DOUBLE PRECISION,
    "meas_hips" DOUBLE PRECISION,
    "meas_shoulders" DOUBLE PRECISION,
    "t_height" DOUBLE PRECISION,
    "t_fullness" DOUBLE PRECISION,
    "body_label" TEXT,
    "ethnicity" VARCHAR(100),
    "gender" VARCHAR(50),
    "location" VARCHAR(255),
    "preferences" JSONB,
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "consent_at" TIMESTAMP,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dress_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "ethnicity" VARCHAR(100),
    "body_label" VARCHAR(50),
    "glb_s3_key" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dress_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "job_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "current_stage" VARCHAR(100),
    "tripo_task_id" VARCHAR(255),
    "input_s3_key" TEXT,
    "output_glb_s3_key" TEXT,
    "output_glb_redis_key" VARCHAR(255),
    "error_message" TEXT,
    "used_fallback" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP,

    CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "consent_type" VARCHAR(50) NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_profiles_user_id_idx" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "dress_templates_category_is_active_idx" ON "dress_templates"("category", "is_active");

-- CreateIndex
CREATE INDEX "dress_templates_ethnicity_body_label_idx" ON "dress_templates"("ethnicity", "body_label");

-- CreateIndex
CREATE INDEX "generation_jobs_user_id_status_idx" ON "generation_jobs"("user_id", "status");

-- CreateIndex
CREATE INDEX "generation_jobs_status_created_at_idx" ON "generation_jobs"("status", "created_at");

-- CreateIndex
CREATE INDEX "consent_records_user_id_consent_type_idx" ON "consent_records"("user_id", "consent_type");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
