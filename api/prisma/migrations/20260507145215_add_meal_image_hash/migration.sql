-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "imageHash" TEXT,
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "thumbKey" TEXT;

-- CreateIndex
CREATE INDEX "Meal_userId_imageHash_createdAt_idx" ON "Meal"("userId", "imageHash", "createdAt");
