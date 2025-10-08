import { z } from 'zod'
import {
	deleteDevice as deleteDeviceById,
} from '~/models/device.server'
import { verifyLogin } from '~/models/user.server'
import type { Device, User } from '~/schema'

export const CreateBoxSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name too long"),
	exposure: z.enum(["indoor", "outdoor", "mobile", "unknown"]).optional().default("unknown"),
	location: z.array(z.number()).length(2, "Location must be [longitude, latitude]"),
	grouptag: z.array(z.string()).optional().default([]),
	model: z.enum(["homeV2Lora", "homeV2Ethernet", "homeV2Wifi", "senseBox:Edu", "luftdaten.info", "Custom"]).optional().default("Custom"),
	sensors: z.array(z.object({
		id: z.string(),
		icon: z.string().optional(),
		title: z.string().min(1, "Sensor title is required"),
		unit: z.string().min(1, "Sensor unit is required"),
		sensorType: z.string().min(1, "Sensor type is required"),
	})).optional().default([]),
});

export const BoxesQuerySchema = z.object({
	format: z.enum(["json", "geojson"]  ,{
		errorMap: () => ({ message: "Format must be either 'json' or 'geojson'" }),
	  }).default("json"),
	minimal: z.enum(["true", "false"]).default("false")
	  .transform((v) => v === "true"),
	full: z.enum(["true", "false"]).default("false")
	  .transform((v) => v === "true"),
	limit: z
	  .string()
	  .default("5")
	  .transform((val) => parseInt(val, 10))
	  .refine((val) => !isNaN(val), { message: "Limit must be a number" })
	  .refine((val) => val >= 1, { message: "Limit must be at least 1" })
	  .refine((val) => val <= 20, { message: "Limit must not exceed 20" }),
  
	name: z.string().optional(),
	date: z.preprocess(
		(val) => {
		  if (typeof val === "string") return [val];
		  if (Array.isArray(val)) return val;
		  return val; 
		},
		z.array(z.string())
		  .min(1, "At least one date required")
		  .max(2, "At most two dates allowed")
		  .transform((arr) => {
			const [fromDateStr, toDateStr] = arr;
			const fromDate = new Date(fromDateStr);
			if (isNaN(fromDate.getTime())) throw new Error(`Invalid date: ${fromDateStr}`);
	  
			if (!toDateStr) {
			  return {
				fromDate: new Date(fromDate.getTime() - 4 * 60 * 60 * 1000),
				toDate: new Date(fromDate.getTime() + 4 * 60 * 60 * 1000),
			  };
			}
	  
			const toDate = new Date(toDateStr);
			if (isNaN(toDate.getTime())) throw new Error(`Invalid date: ${toDateStr}`);
			return { fromDate, toDate };
		  })
	  ).optional(),
	phenomenon: z.string().optional(),
	grouptag: z.string().transform((v) => [v]).optional(),
	model: z.string().transform((v) => [v]).optional(),
	exposure: z.string().transform((v) => [v]).optional(),
  
	near: z
	  .string()
	  .regex(/^[-+]?\d+(\.\d+)?,[-+]?\d+(\.\d+)?$/, {
		message: "Invalid 'near' parameter format. Expected: 'lat,lng'",
	  })
	  .transform((val) => val.split(",").map(Number) as [number, number])
	  .optional(),
  
	maxDistance: z.string().transform((v) => Number(v)).optional(),
  
	bbox: z
	  .string()
	  .transform((val) => {
		const coords = val.split(",").map(Number);
		if (coords.length !== 4 || coords.some((n) => isNaN(n))) {
		  throw new Error("Invalid bbox parameter");
		}
		const [swLng, swLat, neLng, neLat] = coords;
		return {
		  coordinates: [
			[
			  [swLat, swLng],
			  [neLat, swLng],
			  [neLat, neLng],
			  [swLat, neLng],
			  [swLat, swLng],
			],
		  ],
		};
	  })
	  .optional(),
  
	fromDate: z.string().datetime().transform((v) => new Date(v)).optional(),
	toDate: z.string().datetime().transform((v) => new Date(v)).optional(),
  })
//   .refine(
//     (data) =>
//       !(data.date && !data.phenomenon) && !(data.phenomenon && !data.date),
//     {
//       message: "Date and phenomenon must be used together",
//       path: ["date"],
//     }
//   );
    
  
  export type BoxesQueryParams = z.infer<typeof BoxesQuerySchema>;

/**
 * Deletes a device after verifiying that the user is entitled by checking
 * the password.
 * @param user The user deleting the device
 * @param password The users password to verify
 * @returns True if the device was deleted, otherwise false or "unauthorized"
 * if the user is not entitled to delete the device with the given parameters
 */
export const deleteDevice = async (
	user: User,
	device: Device,
	password: string,
): Promise<boolean | 'unauthorized'> => {
	const verifiedUser = await verifyLogin(user.email, password)
	if (verifiedUser === null) return 'unauthorized'
	return (await deleteDeviceById({ id: device.id })).count > 0
}
