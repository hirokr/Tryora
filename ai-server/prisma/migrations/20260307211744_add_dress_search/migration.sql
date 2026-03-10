-- CreateEnum
CREATE TYPE "job_status" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "job_type" AS ENUM ('TRYON_GENERATION', 'POSE_ESTIMATION', 'BACKGROUND_REMOVAL', 'IMAGE_PROCESSING', 'GARMENT_SEGMENTATION', 'MODEL_3D_GENERATION', 'RECOMMENDATION_GENERATION');

-- CreateEnum
CREATE TYPE "moderation_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "search_status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "avatar_url" TEXT,
    "verification_token" VARCHAR(255),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    "oauth_provider" VARCHAR(50),
    "oauth_id" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "user_id" UUID NOT NULL,
    "preferred_colors" JSONB,
    "style_tags" JSONB,
    "size_profile" JSONB,
    "body_measurements" JSONB,
    "notification_prefs" JSONB DEFAULT '{}',
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_body_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "pose_data" JSONB,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "user_body_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "session_id" VARCHAR(255) NOT NULL,
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMP NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(50),
    "date" DATE,
    "location" VARCHAR(255),
    "weather_context" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "sub_category" VARCHAR(50),
    "brand" VARCHAR(100),
    "color_tags" JSONB DEFAULT '[]',
    "style_tags" JSONB DEFAULT '[]',
    "season_tags" JSONB DEFAULT '[]',
    "image_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "processed_image_url" TEXT,
    "model_3d_url" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "garments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outfits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255),
    "description" TEXT,
    "event_id" UUID,
    "preview_image_url" TEXT,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "outfits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outfit_items" (
    "outfit_id" UUID NOT NULL,
    "garment_id" UUID NOT NULL,
    "layer_order" INTEGER NOT NULL,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "outfit_items_pkey" PRIMARY KEY ("outfit_id","garment_id")
);

-- CreateTable
CREATE TABLE "tryon_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "body_image_id" UUID NOT NULL,
    "outfit_id" UUID,
    "result_image_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "generation_params" JSONB,
    "processing_time_ms" INTEGER,
    "model_version" VARCHAR(50),
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "tryon_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processing_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "job_type" "job_type" NOT NULL,
    "status" "job_status" NOT NULL DEFAULT 'QUEUED',
    "input_data" JSONB NOT NULL,
    "result_data" JSONB,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP,
    "completed_at" TIMESTAMP,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "event_id" UUID,
    "recommended_outfit_ids" JSONB NOT NULL DEFAULT '[]',
    "recommended_garment_ids" JSONB NOT NULL DEFAULT '[]',
    "algorithm_version" VARCHAR(50) NOT NULL,
    "algorithm_params" JSONB,
    "user_feedback" JSONB,
    "feedback_score" REAL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "metric_name" VARCHAR(100) NOT NULL,
    "metric_value" REAL NOT NULL,
    "metric_unit" VARCHAR(50),
    "tags" JSONB DEFAULT '{}',
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID,
    "changes" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_moderation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "status" "moderation_status" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "content_moderation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dress_searches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "prompt" TEXT NOT NULL,
    "geo" VARCHAR(255) NOT NULL,
    "parsed_params" JSONB,
    "task_id" VARCHAR(255) NOT NULL,
    "status" "search_status" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "dress_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dress_products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "search_id" UUID NOT NULL,
    "product_name" VARCHAR(500) NOT NULL,
    "price" VARCHAR(100),
    "image_url" TEXT,
    "product_url" TEXT NOT NULL,
    "description" TEXT,
    "brand" VARCHAR(255),
    "availability" VARCHAR(100),
    "raw_metadata" JSONB,
    "source" VARCHAR(50),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dress_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_oauth_provider_oauth_id_idx" ON "users"("oauth_provider", "oauth_id");

-- CreateIndex
CREATE INDEX "user_body_images_user_id_is_default_idx" ON "user_body_images"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "user_body_images_user_id_created_at_idx" ON "user_body_images"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_session_id_key" ON "refresh_tokens"("session_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_session_id_idx" ON "refresh_tokens"("session_id");

-- CreateIndex
CREATE INDEX "events_user_id_date_idx" ON "events"("user_id", "date");

-- CreateIndex
CREATE INDEX "events_event_type_idx" ON "events"("event_type");

-- CreateIndex
CREATE INDEX "garments_user_id_category_idx" ON "garments"("user_id", "category");

-- CreateIndex
CREATE INDEX "garments_category_is_public_idx" ON "garments"("category", "is_public");

-- CreateIndex
CREATE INDEX "garments_created_at_idx" ON "garments"("created_at" DESC);

-- CreateIndex
CREATE INDEX "outfits_user_id_created_at_idx" ON "outfits"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "outfits_user_id_event_id_idx" ON "outfits"("user_id", "event_id");

-- CreateIndex
CREATE INDEX "outfits_user_id_is_favorite_idx" ON "outfits"("user_id", "is_favorite");

-- CreateIndex
CREATE INDEX "outfit_items_outfit_id_layer_order_idx" ON "outfit_items"("outfit_id", "layer_order");

-- CreateIndex
CREATE INDEX "tryon_results_user_id_created_at_idx" ON "tryon_results"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "tryon_results_user_id_is_favorite_idx" ON "tryon_results"("user_id", "is_favorite");

-- CreateIndex
CREATE INDEX "tryon_results_body_image_id_idx" ON "tryon_results"("body_image_id");

-- CreateIndex
CREATE INDEX "tryon_results_outfit_id_idx" ON "tryon_results"("outfit_id");

-- CreateIndex
CREATE INDEX "processing_jobs_status_created_at_idx" ON "processing_jobs"("status", "created_at");

-- CreateIndex
CREATE INDEX "processing_jobs_user_id_status_idx" ON "processing_jobs"("user_id", "status");

-- CreateIndex
CREATE INDEX "processing_jobs_job_type_status_idx" ON "processing_jobs"("job_type", "status");

-- CreateIndex
CREATE INDEX "processing_jobs_priority_created_at_idx" ON "processing_jobs"("priority", "created_at");

-- CreateIndex
CREATE INDEX "recommendation_logs_user_id_created_at_idx" ON "recommendation_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "recommendation_logs_event_id_idx" ON "recommendation_logs"("event_id");

-- CreateIndex
CREATE INDEX "system_metrics_metric_name_timestamp_idx" ON "system_metrics"("metric_name", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "system_metrics_timestamp_idx" ON "system_metrics"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_timestamp_idx" ON "audit_logs"("user_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_timestamp_idx" ON "audit_logs"("action", "timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "dress_searches_task_id_key" ON "dress_searches"("task_id");

-- CreateIndex
CREATE INDEX "dress_searches_user_id_created_at_idx" ON "dress_searches"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "dress_searches_status_idx" ON "dress_searches"("status");

-- CreateIndex
CREATE INDEX "dress_searches_task_id_idx" ON "dress_searches"("task_id");

-- CreateIndex
CREATE INDEX "dress_products_search_id_idx" ON "dress_products"("search_id");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_body_images" ADD CONSTRAINT "user_body_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garments" ADD CONSTRAINT "garments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfits" ADD CONSTRAINT "outfits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfits" ADD CONSTRAINT "outfits_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_outfit_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "outfits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_garment_id_fkey" FOREIGN KEY ("garment_id") REFERENCES "garments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tryon_results" ADD CONSTRAINT "tryon_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tryon_results" ADD CONSTRAINT "tryon_results_body_image_id_fkey" FOREIGN KEY ("body_image_id") REFERENCES "user_body_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tryon_results" ADD CONSTRAINT "tryon_results_outfit_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "outfits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_logs" ADD CONSTRAINT "recommendation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_logs" ADD CONSTRAINT "recommendation_logs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dress_searches" ADD CONSTRAINT "dress_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dress_products" ADD CONSTRAINT "dress_products_search_id_fkey" FOREIGN KEY ("search_id") REFERENCES "dress_searches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
