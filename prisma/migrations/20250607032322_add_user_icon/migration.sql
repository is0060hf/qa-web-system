-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileImageId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_profileImageId_fkey" FOREIGN KEY ("profileImageId") REFERENCES "MediaFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
