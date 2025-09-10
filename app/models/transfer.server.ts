import { Claim, claim, Device } from "~/schema";
import { drizzleClient } from "~/db.server";
import { eq } from "drizzle-orm";

export interface TransferCode {
    id: string;
    boxId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
  }
  
  export const createTransfer = async (
    boxId: string,
    userId: string,
    expiresAt: Date
  ): Promise<TransferCode> => {
    const code = generateTransferCode(); 
    
    const [inserted] = await drizzleClient
    .insert(claim)
    .values({
      boxId,
      token: code,
      expiresAt: expiresAt,
    })
    .returning();

    return {
        id: inserted.id,
        boxId: inserted.boxId,
        token: inserted.token!,
        expiresAt: inserted.expiresAt!,
        createdAt: inserted.createdAt!,
      };
  };
  
  export const generateTransferCode = (): string => {
    const crypto = require('crypto');
    return crypto.randomBytes(6).toString('hex');
  };

  export function getTransfer({ id }: Pick<Device, 'id'>){
    return drizzleClient.query.claim.findFirst({
      where: (claim, {eq}) => eq(claim.boxId, id)
    })
  };  


export const removeTransfer = async (
  boxId: string,
  token: string
): Promise<void> => {
  const [existingClaim] = await drizzleClient
    .select()
    .from(claim)
    .where(eq(claim.token, token) && eq(claim.boxId, boxId));

  if (!existingClaim) {
    throw new Error("Transfer token not found");
  }

  await drizzleClient
    .delete(claim)
    .where(eq(claim.id, existingClaim.id));
};
  
