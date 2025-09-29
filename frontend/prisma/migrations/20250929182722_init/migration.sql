/*
  Warnings:

  - You are about to drop the column `filename` on the `Video` table. All the data in the column will be lost.
  - Added the required column `s3url` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Video" DROP COLUMN "filename",
ADD COLUMN     "s3url" TEXT NOT NULL;
