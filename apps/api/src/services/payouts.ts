/**
 * Razorpay Connect — mentor payouts.
 *
 * Flow:
 *  1. Mentor links their Razorpay account → we store razorpayAccountId.
 *  2. Candidate books mock → Razorpay order created (handled in billing).
 *  3. Payment captured → webhook fires → splits into mentor + platform cuts.
 *  4. When EXPERT mock COMPLETED, we mark the payout as ready and trigger
 *     a Razorpay transfer to the mentor's linked account.
 *
 * Phase 3 Week 17–18 per spec. Real Razorpay Route docs:
 *   https://razorpay.com/docs/payments/route/
 */
import { prisma, MockType, MockStatus, PayoutStatus } from "@eyf/db";
import { razorpay } from "./razorpay.js";

export const PLATFORM_FEE_PCT = 0.20; // 20% to EYF, 80% to mentor

/** Pure payout split — mentor gets (1 - fee) of the pro-rated hourly rate (in paisa). */
export function computePayoutSplit(hourlyRateInr: number, durationMin: number): { platformFeeInr: number; mentorShareInr: number } {
  const totalInrPaisa = hourlyRateInr * 100 * (durationMin / 60);
  const platformFeeInr = Math.round(totalInrPaisa * PLATFORM_FEE_PCT);
  const mentorShareInr = Math.round(totalInrPaisa - platformFeeInr);
  return { platformFeeInr, mentorShareInr };
}


/**
 * Called when an EXPERT mock moves to COMPLETED. Idempotent on mockSessionId.
 */
export async function settleExpertMockPayout(mockSessionId: string): Promise<void> {
  const mock = await prisma.mockSession.findUnique({
    where: { id: mockSessionId },
    include: { mentor: true },
  });
  if (mock?.type !== MockType.EXPERT || mock?.status !== MockStatus.COMPLETED) return;
  if (!mock.mentor) return;

  // Idempotency — already settled?
  const existing = await prisma.mentorPayout.findUnique({ where: { mockSessionId } });
  if (existing) return;

  const { platformFeeInr, mentorShareInr } = computePayoutSplit(mock.mentor.hourlyRateInr, mock.durationMin);

  const payout = await prisma.mentorPayout.create({
    data: {
      mentorId: mock.mentor.id,
      mockSessionId,
      amountInr: mentorShareInr,
      platformFeeInr,
      status: PayoutStatus.PENDING,
    },
  });

  // If we don't have Razorpay or the mentor hasn't linked an account, leave PENDING
  // — a finance ops job processes it manually later.
  if (!razorpay || !mock.mentor.razorpayAccountId) return;

  /* c8 ignore start -- live Razorpay Transfers SDK path; unreachable in tests
     (no razorpay client / linked account). The payout math + PENDING create above
     are covered; this is external-service glue exercised only against real keys. */
  try {
    // Razorpay Transfers API. Payment splitting via Route would normally happen
    // at order-creation time; this fallback creates a transfer from platform
    // balance for sessions that weren't pre-split.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rp = razorpay as any;
    const transfer = await rp.transfers.create({
      account: mock.mentor.razorpayAccountId,
      amount: mentorShareInr,
      currency: "INR",
      notes: { mockSessionId, mentorId: mock.mentor.id },
    });
    await prisma.mentorPayout.update({
      where: { id: payout.id },
      data: {
        razorpayTransferId: transfer.id,
        status: PayoutStatus.PROCESSED,
        processedAt: new Date(),
      },
    });
  } catch (err) {
    await prisma.mentorPayout.update({
      where: { id: payout.id },
      data: {
        status: PayoutStatus.FAILED,
        errorMessage: (err as Error).message,
      },
    });
  }
  /* c8 ignore stop */
}
