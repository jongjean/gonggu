-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tools" (
    "id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "type" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "serial_number" TEXT,
    "purchase_price" INTEGER,
    "purchase_date" TIMESTAMP(3),
    "purchase_store" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "condition" TEXT NOT NULL DEFAULT 'excellent',
    "location" TEXT,
    "ai_confidence" DOUBLE PRECISION,
    "ai_provider" TEXT,
    "ai_raw_result" JSONB,
    "images" JSONB,
    "thumbnail" TEXT,
    "embedding" vector(512),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rentals" (
    "id" SERIAL NOT NULL,
    "tool_id" INTEGER NOT NULL,
    "lender_id" INTEGER NOT NULL,
    "borrower_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "returned_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_events" (
    "id" SERIAL NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_hash" TEXT,
    "ai_prediction" JSONB NOT NULL,
    "ai_confidence" DOUBLE PRECISION NOT NULL,
    "ai_provider" TEXT NOT NULL DEFAULT 'gemini',
    "yolo_result" JSONB,
    "ground_truth" JSONB,
    "corrected_by" INTEGER,
    "is_correct" BOOLEAN,
    "tool_id" INTEGER,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_corrections" (
    "id" SERIAL NOT NULL,
    "ai_event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "original_field" TEXT NOT NULL,
    "original_value" TEXT,
    "corrected_value" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "tools_owner_id_idx" ON "tools"("owner_id");

-- CreateIndex
CREATE INDEX "tools_status_idx" ON "tools"("status");

-- CreateIndex
CREATE INDEX "rentals_tool_id_idx" ON "rentals"("tool_id");

-- CreateIndex
CREATE INDEX "rentals_returned_at_idx" ON "rentals"("returned_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_events_image_hash_key" ON "ai_events"("image_hash");

-- CreateIndex
CREATE INDEX "ai_events_ai_provider_idx" ON "ai_events"("ai_provider");

-- CreateIndex
CREATE INDEX "ai_events_created_at_idx" ON "ai_events"("created_at");

-- AddForeignKey
ALTER TABLE "tools" ADD CONSTRAINT "tools_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_events" ADD CONSTRAINT "ai_events_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_corrections" ADD CONSTRAINT "ai_corrections_ai_event_id_fkey" FOREIGN KEY ("ai_event_id") REFERENCES "ai_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_corrections" ADD CONSTRAINT "ai_corrections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
