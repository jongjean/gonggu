-- Gonggu Platform Schema
-- PostgreSQL with pgvector extension

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE IF NOT EXISTS "User" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tools table  
CREATE TABLE IF NOT EXISTS "Tool" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(255) NOT NULL,
    description TEXT,
    "imageUrl" TEXT NOT NULL,
    condition VARCHAR(100),
    "purchaseDate" TIMESTAMP(3),
    "rentalPrice" INTEGER NOT NULL DEFAULT 0,
    "ownerId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    embedding vector(512)
);

-- Rentals table
CREATE TABLE IF NOT EXISTS "Rental" (
    id SERIAL PRIMARY KEY,
    "toolId" INTEGER NOT NULL REFERENCES "Tool"(id) ON DELETE CASCADE,
    "renterId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    "totalPrice" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AI Events table
CREATE TABLE IF NOT EXISTS "AiEvent" (
    id SERIAL PRIMARY KEY,
    "toolId" INTEGER REFERENCES "Tool"(id) ON DELETE SET NULL,
    "imageUrl" TEXT NOT NULL,
    prediction JSONB NOT NULL,
    "userCorrection" JSONB,
    "wasCorrect" BOOLEAN,
    "confidenceScore" DOUBLE PRECISION,
    provider VARCHAR(50),
    "modelVersion" VARCHAR(100),
    "processingTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Tool_ownerId_idx" ON "Tool"("ownerId");
CREATE INDEX IF NOT EXISTS "Tool_category_idx" ON "Tool"(category);
CREATE INDEX IF NOT EXISTS "Rental_toolId_idx" ON "Rental"("toolId");
CREATE INDEX IF NOT EXISTS "Rental_renterId_idx" ON "Rental"("renterId");
CREATE INDEX IF NOT EXISTS "AiEvent_toolId_idx" ON "AiEvent"("toolId");
CREATE INDEX IF NOT EXISTS "AiEvent_createdAt_idx" ON "AiEvent"("createdAt");
