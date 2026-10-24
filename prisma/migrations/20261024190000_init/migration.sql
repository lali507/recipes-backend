-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "KosherType" AS ENUM ('MEAT', 'DAIRY', 'PAREVE');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "ingredients" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "prep_time_minutes" INTEGER NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "servings" INTEGER NOT NULL,
    "kosher_type" "KosherType" NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "image_public_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "author_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "user_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id","recipe_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "recipes_author_id_idx" ON "recipes"("author_id");

-- CreateIndex
CREATE INDEX "recipes_category_id_idx" ON "recipes"("category_id");

-- CreateIndex
CREATE INDEX "recipes_is_public_created_at_idx" ON "recipes"("is_public", "created_at");

-- CreateIndex
CREATE INDEX "favorites_recipe_id_idx" ON "favorites"("recipe_id");

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================================
-- אילוצי תקינות (CHECK) – הגנה נוספת ברמת מסד הנתונים,
-- בנוסף לוולידציה שהשרת מבצע עם Zod.
-- =====================================================================

-- AddCheckConstraint
ALTER TABLE "users" ADD CONSTRAINT "users_name_length_check" CHECK (char_length(btrim("name")) BETWEEN 2 AND 50);

-- AddCheckConstraint
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_length_check" CHECK (char_length(btrim("name")) BETWEEN 2 AND 40);

-- AddCheckConstraint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_title_length_check" CHECK (char_length(btrim("title")) BETWEEN 2 AND 100);

-- AddCheckConstraint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_description_length_check" CHECK (char_length(btrim("description")) BETWEEN 5 AND 500);

-- AddCheckConstraint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_ingredients_length_check" CHECK (char_length(btrim("ingredients")) BETWEEN 1 AND 5000);

-- AddCheckConstraint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_instructions_length_check" CHECK (char_length(btrim("instructions")) BETWEEN 1 AND 10000);

-- AddCheckConstraint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_prep_time_range_check" CHECK ("prep_time_minutes" BETWEEN 1 AND 1440);

-- AddCheckConstraint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_servings_range_check" CHECK ("servings" BETWEEN 1 AND 100);
