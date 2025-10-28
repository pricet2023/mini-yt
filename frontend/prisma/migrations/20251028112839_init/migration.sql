/*
  Warnings:

  - Added the required column `s3thumbnailurl` to the `videos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."videos" ADD COLUMN     "s3thumbnailurl" TEXT NOT NULL;
