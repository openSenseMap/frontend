import { drizzleClient } from "~/db.server";
import {
  type LogEntry,
  logEntry,
  type InsertLogEntry,
} from "~/schema/log-entry";
import { eq, and } from "drizzle-orm";

/**
 * Create a new log entry for a device
 */
export async function createLogEntry({
  deviceId,
  content,
  public: isPublic,
}: Pick<InsertLogEntry, "deviceId" | "content" | "public">) {
  const newLogEntry = await drizzleClient
    .insert(logEntry)
    .values({
      deviceId,
      content,
      public: isPublic, // Default to `false` if not specified
    })
    .returning();

  return newLogEntry[0]; // Return the created log entry
}

/**
 * Retrieve log entries for a specific device by its ID
 */
export async function getLogEntriesByDeviceId(deviceId: LogEntry["deviceId"]) {
  const logEntries = await drizzleClient
    .select()
    .from(logEntry)
    .where(eq(logEntry.deviceId, deviceId));

  return logEntries;
}

/**
 * Retrieve public log entries for a specific device by its ID
 */
export async function getPublicLogEntriesByDeviceId(
  deviceId: LogEntry["deviceId"],
) {
  const publicLogEntries = await drizzleClient
    .select()
    .from(logEntry)
    .where(
      and(
        eq(logEntry.deviceId, deviceId),
        eq(logEntry.public, true), // Combine conditions using `and`
      ),
    );

  return publicLogEntries;
}

/**
 * Delete a log entry by its ID
 */
export async function deleteLogEntry(logEntryId: string) {
  await drizzleClient.delete(logEntry).where(eq(logEntry.id, logEntryId));
}
