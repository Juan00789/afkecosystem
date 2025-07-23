'use server';
/**
 * @fileOverview An AI flow for handling peer-to-peer credit transfers.
 *
 * - processP2PTransfer - A function that handles the credit transfer between two users.
 * - P2PTransferInput - The input type for the transfer.
 * - P2PTransferOutput - The return type for the transfer.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, runTransaction, serverTimestamp, collection, addDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const P2PTransferInputSchema = z.object({
  senderUid: z.string().describe('The UID of the user sending credits.'),
  recipientUid: z.string().describe('The UID of the user receiving credits.'),
  amount: z.number().positive('Amount must be a positive number.'),
});
export type P2PTransferInput = z.infer<typeof P2PTransferInputSchema>;

const P2PTransferOutputSchema = z.object({
  success: z.boolean().describe('Whether the transfer was successful.'),
  message: z.string().describe('A message describing the result of the transfer.'),
  transactionId: z.string().optional().describe('The ID of the recorded transaction.'),
});
export type P2PTransferOutput = z.infer<typeof P2PTransferOutputSchema>;


export async function processP2PTransfer(input: P2PTransferInput): Promise<P2PTransferOutput> {
  try {
    const { senderUid, recipientUid, amount } = input;
    
    if (senderUid === recipientUid) {
      return { success: false, message: 'You cannot send credits to yourself.' };
    }

    const transactionId = await runTransaction(db, async (transaction) => {
      const senderRef = doc(db, 'users', senderUid);
      const recipientRef = doc(db, 'users', recipientUid);

      const senderDoc = await transaction.get(senderRef);

      if (!senderDoc.exists() || (senderDoc.data().credits || 0) < amount) {
        throw new Error('Insufficient credits or sender not found.');
      }

      // Perform the transfer
      transaction.update(senderRef, { credits: increment(-amount) });
      transaction.update(recipientRef, { credits: increment(amount) });

      // Record the transaction
      const p2pTransactionRef = doc(collection(db, 'p2p_transactions'));
      transaction.set(p2pTransactionRef, {
        senderUid,
        recipientUid,
        amount,
        createdAt: serverTimestamp(),
      });
      
      return p2pTransactionRef.id;
    });

    return { 
        success: true, 
        message: `Successfully transferred ${amount} credits.`,
        transactionId,
    };

  } catch (error: any) {
    console.error("P2P Transfer failed:", error);
    return { success: false, message: error.message || 'An unexpected error occurred during the transfer.' };
  }
}
