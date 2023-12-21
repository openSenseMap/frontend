import { drizzleClient } from "~/db.server";
import { Device, User } from "~/schema";
import { bookmarks } from "~/schema/bookmarks";

export async function bookmarkDevice(userId: User['id'], deviceId: Device['id']){
    const newDeviceBookmark = await drizzleClient.insert(bookmarks).values({userId, deviceId}).returning()
    return newDeviceBookmark
}