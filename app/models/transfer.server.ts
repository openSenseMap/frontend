import { eq } from "drizzle-orm";
import { drizzleClient } from "~/db.server";
import { type Claim, claim, device, type Device } from "~/schema";

export interface TransferCode {
    id: string;
    boxId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
  }

  export const getDefaultExpirationDate = (): Date => {
    const now = new Date();
    now.setHours(now.getHours() + 24);
    return now;
  };

  export const isClaimExpired = (expiresAt: Date | null): boolean => {
    if (!expiresAt) return false;
    return expiresAt <= new Date();
  };

  export const createTransfer = async (
    boxId: string,
    expiresAt?: Date
  ): Promise<Claim> => {
    const token = generateTransferCode();
    const expirationDate = expiresAt || getDefaultExpirationDate();
  
    const [newClaim] = await drizzleClient
      .insert(claim)
      .values({
        boxId,
        token,
        expiresAt: expirationDate,
      })
      .returning();
  
    if (!newClaim) {
      throw new Error("Failed to create transfer claim");
    }
  
    return newClaim;
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


export const getTransferByBoxId = async (
  boxId: string
): Promise<Claim | null> => {
  const [result] = await drizzleClient
    .select()
    .from(claim)
    .where(eq(claim.boxId, boxId))
    .limit(1);

  return result || null;
};

export const deleteClaimById = async (claimId: string): Promise<void> => {
  await drizzleClient.delete(claim).where(eq(claim.id, claimId));
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

export const updateTransferExpiration = async (
  claimId: string,
  expiresAt: Date
): Promise<Claim> => {
  const [updated] = await drizzleClient
    .update(claim)
    .set({ 
      expiresAt, 
      updatedAt: new Date()  
    })
    .where(eq(claim.id, claimId))
    .returning();

  if (!updated) {
    throw new Error("Failed to update transfer claim");
  }

  return updated;
}

export const getTransferByToken = async (
  token: string
): Promise<Claim | null> => {
  const [result] = await drizzleClient
    .select()
    .from(claim)
    .where(eq(claim.token, token))
    .limit(1);

  return result || null;
};

export const claimBoxTransfer = async (
  newOwnerId: string,
  token: string
): Promise<{ boxId: string }> => {
  const transfer = await getTransferByToken(token);

  if (!transfer) {
    throw new Error("Invalid or expired transfer token");
  }

  if (isClaimExpired(transfer.expiresAt)) {
    throw new Error("Transfer token has expired");
  }

  const box = await drizzleClient.query.device.findFirst({
    where: (device, { eq }) => eq(device.id, transfer.boxId),
    columns: {
      id: true,
      userId: true,
    },
  });

  if (!box) {
    throw new Error("Device not found");
  }

  if (box.userId === newOwnerId) {
    throw new Error("You already own this device");
  }

  await drizzleClient
    .update(device)
    .set({ userId: newOwnerId, updatedAt: new Date() })
    .where(eq(device.id, transfer.boxId));

  await deleteClaimById(transfer.id);

  return { boxId: transfer.boxId };
};
  
