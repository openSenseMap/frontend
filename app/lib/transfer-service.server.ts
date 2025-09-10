import { createTransfer, getTransfer, removeTransfer, TransferCode } from "~/models/transfer.server";
import { getDevice } from "~/models/device.server";
import { claim, Claim, device } from "~/schema";
import { drizzleClient } from "~/db.server";
import { eq } from "drizzle-orm";


export const createBoxTransfer = async (
    userId: string,
    boxId: string,
    expiresAt?: string
  ): Promise<TransferCode> => {
    const box = await getDevice({id: boxId});
    if (!box) {
      throw new Error("Box not found");
    }
    
    if (box.user.id !== userId) {
      throw new Error("You don't have permission to transfer this box");
    }
  
    let expirationDate: Date;
    if (expiresAt) {
      expirationDate = new Date(expiresAt);
      if (isNaN(expirationDate.getTime())) {
        throw new Error("Invalid expiration date format");
      }
    } else {
      expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 24);
    }
  
    if (expirationDate <= new Date()) {
      throw new Error("Expiration date must be in the future");
    }
  
    const transferCode = await createTransfer(boxId, userId, expirationDate);
    
    return transferCode;
  };

  export const getBoxTransfer = async (
    boxId: string,
  ): Promise<Claim> => {
    const transfer = await getTransfer({id: boxId});
    if (!transfer) {
      throw new Error("Transfer not found");
    }
    
    // if (transfer.user.id !== userId) {
    //   throw new Error("You don't have permission to transfer this box");
    // }
    return transfer;
  };  

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

  export const claimBoxTransfer = async (userId: string, token: string) => {
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