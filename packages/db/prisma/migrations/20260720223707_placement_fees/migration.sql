-- CreateEnum
CREATE TYPE "PlacementFeeStatus" AS ENUM ('PENDING', 'INVOICED', 'PAID', 'WAIVED');

-- CreateTable
CREATE TABLE "placement_fees" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "ctcInr" INTEGER NOT NULL,
    "feeBps" INTEGER NOT NULL,
    "feeInr" INTEGER NOT NULL,
    "status" "PlacementFeeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoicedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "placement_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "placement_fees_offerId_key" ON "placement_fees"("offerId");

-- CreateIndex
CREATE INDEX "placement_fees_orgId_status_idx" ON "placement_fees"("orgId", "status");

-- AddForeignKey
ALTER TABLE "placement_fees" ADD CONSTRAINT "placement_fees_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "org_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_fees" ADD CONSTRAINT "placement_fees_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

