/*
  Warnings:

  - You are about to drop the column `is_used` on the `user_coupons` table. All the data in the column will be lost.
  - You are about to drop the column `used_at` on the `user_coupons` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "current_usage_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_usage_limit" INTEGER,
ADD COLUMN     "usage_limit_per_user" INTEGER;

-- AlterTable
ALTER TABLE "user_coupons" DROP COLUMN "is_used",
DROP COLUMN "used_at",
ADD COLUMN     "last_used_at" TIMESTAMP(3),
ADD COLUMN     "usage_count" INTEGER NOT NULL DEFAULT 0;
