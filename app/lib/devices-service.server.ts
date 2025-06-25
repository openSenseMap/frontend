import { Device, User } from '~/schema'
import {
	deleteDevice as deleteDeviceById,
} from '~/models/device.server'
import { verifyLogin } from '~/models/user.server'

export interface BoxesQueryParams {
	name?: string
	limit?: string
	date?: string
	phenomenon?: string
	format?: 'json' | 'geojson'
	grouptag?: string
	model?: string
	classify?: 'true' | 'false'
	minimal?: 'true' | 'false'
	full?: 'true' | 'false'
	near?: string
	maxDistance?: string
	bbox?: string
	exposure?: string
}

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
