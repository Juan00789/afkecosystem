'use server';
/**
 * @fileOverview An AI flow for handling case investments.
 *
 * - processInvestment - A function that handles a credit investment in a case.
 * - InvestmentInput - The input type for the investment.
 * - InvestmentOutput - The return type for the investment.
 */

import { z } from 'genkit';
import { doc, runTransaction, serverTimestamp, collection, addDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const InvestmentInputSchema = z.object({
  investorId: z.string().describe('The UID of the user making the investment.'),
  caseId: z.string().describe('The ID of the case being invested in.'),
  amount: z.number().positive('Amount must be a positive number.'),
});
export type InvestmentInput = z.infer<typeof InvestmentInputSchema>;

const InvestmentOutputSchema = z.object({
  success: z.boolean().describe('Whether the investment was successful.'),
  message: z.string().describe('A message describing the result of the investment.'),
  investmentId: z.string().optional().describe('The ID of the recorded investment transaction.'),
});
export type InvestmentOutput = z.infer<typeof InvestmentOutputSchema>;


export async function processInvestment(input: InvestmentInput): Promise<InvestmentOutput> {
  try {
    const { investorId, caseId, amount } = input;

    const investmentId = await runTransaction(db, async (transaction) => {
      const investorRef = doc(db, 'users', investorId);
      const caseRef = doc(db, 'cases', caseId);

      // Verify investor has enough credits
      const investorDoc = await transaction.get(investorRef);
      if (!investorDoc.exists() || (investorDoc.data().credits || 0) < amount) {
        throw new Error('Insufficient credits or investor not found.');
      }
      
      // Verify case exists and investor is not the client or provider
      const caseDoc = await transaction.get(caseRef);
      if (!caseDoc.exists()) {
        throw new Error('Case not found.');
      }
      if (caseDoc.data().clientId === investorId || caseDoc.data().providerId === investorId) {
        throw new Error('You cannot invest in your own case.');
      }

      // Deduct credits from investor
      transaction.update(investorRef, { credits: increment(-amount) });

      // Record the investment in a top-level collection for easier querying
      const investmentRef = doc(collection(db, `investments`));
      transaction.set(investmentRef, {
        investorId,
        caseId,
        amount,
        createdAt: serverTimestamp(),
      });
      
      // We could also transfer credits to an escrow account or a case-specific fund here.
      // For now, we'll just deduct from the investor. The payout logic on case completion handles the return.

      return investmentRef.id;
    });

    return { 
        success: true, 
        message: `Successfully invested ${amount} credits in the case.`,
        investmentId,
    };

  } catch (error: any) {
    console.error("Investment failed:", error);
    return { success: false, message: error.message || 'An unexpected error occurred during the investment.' };
  }
}
