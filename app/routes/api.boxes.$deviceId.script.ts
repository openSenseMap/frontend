import SketchTemplater from '@sensebox/sketch-templater'

import { type LoaderFunction } from 'react-router'
import { type Route } from './+types/api.boxes.$deviceId.script'
import { getDevice } from '~/models/device.server'

const cfg = {
	'sketch-templater': {
		// Ingress domain. Used in the generation of Arduino sketches
		// No default
		ingress_domain: process.env.INGRESS_DOMAIN || 'ingress.opensensemap.org',
	},
}
const templateSketcher = new SketchTemplater(cfg)
type Box = NonNullable<Awaited<ReturnType<typeof getDevice>>>
type BoxForSketch = Box & {
	_id: string
	sensors: Array<Box['sensors'][number] & { _id: string }>
}

const buildBoxForSketch = (
	box: Box,
	formEntries: Record<string, FormDataEntryValue>,
): BoxForSketch => ({
	...box,
	_id: box.id,
	sensors: box.sensors.map((sensor) => ({
		...sensor,
		_id: sensor.id,
	})),
	...formEntries,
})

const handleSketch = async (
	deviceId: string | undefined,
	formEntries: Record<string, FormDataEntryValue>,
): Promise<Response> => {
	if (deviceId === undefined) {
		return Response.json(
			{ code: 'Bad Request', message: 'Invalid device id specified' },
			{
				status: 400,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			},
		)
	}

	const box = await getDevice({ id: deviceId })
	if (!box) {
		return Response.json(
			{ code: 'Not Found', message: 'Device not found' },
			{
				status: 404,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			},
		)
	}

	const boxForSketch = buildBoxForSketch(box, formEntries)
	const sketch = templateSketcher.generateSketch(boxForSketch, { encoding: '' })
	return new Response(sketch, {
		status: 200,
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	})
}

export const loader: LoaderFunction = async ({
	request,
	params,
}: Route.LoaderArgs): Promise<Response> => {
	try {
		const url = new URL(request.url)
		const formEntries = Object.fromEntries(
			url.searchParams.entries(),
		) as Record<string, FormDataEntryValue>

		return handleSketch(params.deviceId, formEntries)
	} catch (err: any) {
		return Response.json(
			{
				code: 'Internal Server Error',
				message: err.message || 'An unexpected error occurred',
			},
			{
				status: 500,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			},
		)
	}
}

export const action = async ({
	request,
	params,
}: Route.ActionArgs): Promise<Response> => {
	try {
		const formData = await request.formData()
		const formEntries = Object.fromEntries(formData.entries())
		return handleSketch(params.deviceId, formEntries)
	} catch (err: any) {
		return Response.json(
			{
				code: 'Internal Server Error',
				message: err.message || 'An unexpected error occurred',
			},
			{
				status: 500,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			},
		)
	}
}
