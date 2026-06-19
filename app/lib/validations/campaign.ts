import { z } from 'zod'

export const campaignFormSchema = z
	.object({
		title: z.string().trim().min(3).max(80),
		description: z.string().trim().min(20).max(4000),
		requirements: z.string().trim().min(10).max(8000),
		discussionUrl: z
			.string()
			.trim()
			.url()
			.optional()
			.or(z.literal('').transform(() => undefined)),
		phenomena: z.array(z.string().trim().min(1)).min(1),
		gridSize: z.number().int().min(2).max(20),
		minDevicesPerCell: z.number().int().min(0).max(100),
		minMeasurementsPerCell: z.number().int().min(1).max(1000000),
		areaGeojson: z.string().trim().min(1),
		startDate: z.date().optional(),
		endDate: z.date().optional(),
	})
	.refine(
		(data) => {
			if (!data.startDate || !data.endDate) return true
			return data.startDate <= data.endDate
		},
		{
			path: ['endDate'],
			message: 'End date must be after the start date.',
		},
	)

export type CampaignFormData = z.infer<typeof campaignFormSchema>
