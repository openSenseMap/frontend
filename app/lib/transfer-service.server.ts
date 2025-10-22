import { createTransfer, getTransfer, getTransferByBoxId, isClaimExpired, removeTransfer, TransferCode, updateTransferExpiration } from "~/models/transfer.server";
import { getDevice } from "~/models/device.server";
import { claim, Claim, device } from "~/schema";
import { drizzleClient } from "~/db.server";
import { eq } from "drizzle-orm";


export const createBoxTransfer = async (
  userId: string,
  boxId: string,
  expiresAtStr?: string
): Promise<Claim> => {
  // Verify box exists
  const box = await getDevice({ id: boxId });

  if (!box) {
    throw new Error("Box not found");
  }

  // Verify user owns the box
  if (box.user.id !== userId) {
    throw new Error("You don't have permission to transfer this box");
  }

  // Check if a transfer already exists for this box
  const existingTransfer = await getTransferByBoxId(boxId);
  if (existingTransfer) {
    throw new Error("Transfer already exists for this device");
  }

  // Parse and validate expiration date
  let expirationDate: Date | undefined;

  if (expiresAtStr) {
    expirationDate = new Date(expiresAtStr);
    
    if (isNaN(expirationDate.getTime())) {
      throw new Error("Invalid expiration date format");
    }
    
    if (expirationDate <= new Date()) {
      throw new Error("Expiration date must be in the future");
    }
  }

  // Create the new transfer claim
  const transferClaim = await createTransfer(boxId, expirationDate);

  return transferClaim;
};

// export const createBoxTransfer = async (
//     userId: string,
//     boxId: string,
//     expiresAt?: string
//   ): Promise<TransferCode> => {
//     const box = await getDevice({id: boxId});
//     if (!box) {
//       throw new Error("Box not found");
//     }
    
//     if (box.user.id !== userId) {
//       throw new Error("You don't have permission to transfer this box");
//     }
  
//     let expirationDate: Date;
//     if (expiresAt) {
//       expirationDate = new Date(expiresAt);
//       if (isNaN(expirationDate.getTime())) {
//         throw new Error("Invalid expiration date format");
//       }
//     } else {
//       expirationDate = new Date();
//       expirationDate.setHours(expirationDate.getHours() + 24);
//     }
  
//     if (expirationDate <= new Date()) {
//       throw new Error("Expiration date must be in the future");
//     }
  
//     const transferCode = await createTransfer(boxId, userId, expirationDate);
    
//     return transferCode;
//   };

export const getBoxTransfer = async (
  userId: string,
  boxId: string
): Promise<Claim> => {
  const box = await getDevice({ id: boxId });

  if (!box) {
    throw new Error("Box not found");
  }

  if (box.user.id !== userId) {
    throw new Error("You don't have permission to view this transfer");
  }

  const transfer = await getTransferByBoxId(boxId);

  if (!transfer) {
    throw new Error("Transfer not found");
  }

  if (isClaimExpired(transfer.expiresAt)) {
    throw new Error("Transfer token has expired");
  }

  return transfer;
};

  // export const getBoxTransfer = async (
  //   boxId: string,
  // ): Promise<Claim> => {
  //   const transfer = await getTransfer({id: boxId});
  //   if (!transfer) {
  //     throw new Error("Transfer not found");
  //   }
    
  //   // if (transfer.user.id !== userId) {
  //   //   throw new Error("You don't have permission to transfer this box");
  //   // }
  //   return transfer;
  // };  

export const removeBoxTransfer = async (
    userId: string,
    boxId: string,
    token: string
  ): Promise<void> => {
    const box = await getDevice({id: boxId});
    if (!box) {
      throw new Error("Box not found");
    }
        
    if (box.user.id !== userId) {
      throw new Error("You don't have permission to remove this transfer");
    }
  
    await removeTransfer(boxId, token);
  };  

  export const claimBox = async (userId: string, token: string) => {
    const [activeClaim] = await drizzleClient
      .select()
      .from(claim)
      .where(eq(claim.token, token))
      .limit(1);
  
    if (!activeClaim) {
      throw new Error("Invalid or expired transfer token");
    }
  
    if (activeClaim.expiresAt && activeClaim.expiresAt <= new Date()) {
      throw new Error("Transfer token has expired");
    }
  
    const [box] = await drizzleClient
      .select()
      .from(device)
      .where(eq(device.id, activeClaim.boxId))
      .limit(1);
  
    if (!box) {
      throw new Error("Device not found");
    }
  
    await drizzleClient
      .update(device)
      .set({ userId })
      .where(eq(device.id, activeClaim.boxId));
  
    await drizzleClient
      .delete(claim)
      .where(eq(claim.id, activeClaim.id));
  
    return { message: "Device successfully claimed!", boxId: activeClaim.boxId };
  };  
  
export const validateTransferParams = (
    boxId?: string,
    expiresAt?: string
  ): { isValid: boolean; error?: string } => {
    if (!boxId || boxId.trim() === "") {
      return { isValid: false, error: "Box ID is required" };
    }
  
    if (expiresAt) {
      const date = new Date(expiresAt);
      if (isNaN(date.getTime())) {
        return { isValid: false, error: "Invalid date format" };
      }
      if (date <= new Date()) {
        return { isValid: false, error: "Expiration date must be in the future" };
      }
    }
  
    return { isValid: true };
  };

/**
 * Update transfer expiration date
 * Only the box owner can update their transfer expiration
 *
 * @param userId - ID of the requesting user
 * @param boxId - ID of the box
 * @param token - The transfer token (for verification)
 * @param newExpiresAtStr - New expiration date as ISO string
 * @returns The updated transfer claim
 */
export const updateBoxTransferExpiration = async (
  userId: string,
  boxId: string,
  token: string,
  newExpiresAtStr: string
): Promise<Claim> => {
  // Verify box exists and get it with user info
  const box = await getDevice({ id: boxId });

  if (!box) {
    throw new Error("Box not found");
  }

  // Verify user owns the box
  if (box.user.id !== userId) {
    throw new Error("You don't have permission to update this transfer");
  }

  // Get the existing transfer
  const transfer = await getTransferByBoxId(boxId);

  if (!transfer) {
    throw new Error("Transfer not found");
  }

  // Verify the token matches
  if (transfer.token !== token) {
    throw new Error("Invalid transfer token");
  }

  // Check if transfer has already expired
  if (isClaimExpired(transfer.expiresAt)) {
    throw new Error("Transfer token has expired");
  }

  // Parse and validate the new expiration date
  const newExpiresAt = new Date(newExpiresAtStr);

  if (isNaN(newExpiresAt.getTime())) {
    throw new Error("Invalid expiration date format");
  }

  if (newExpiresAt <= new Date()) {
    throw new Error("Expiration date must be in the future");
  }

  // Update the transfer expiration
  const updated = await updateTransferExpiration(transfer.id, newExpiresAt);

  return updated;
};  