import { zodResolver } from '@hookform/resolvers/zod'
import { defineStepper } from '@stepperize/react'
import { Info, Slash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type FieldErrors, FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Form, useLoaderData, useSubmit, useNavigation } from 'react-router'
import { z } from 'zod'
import { AdvancedStep } from './advanced-info'
import { DeviceSelectionStep } from './device-info'
import { GeneralInfoStep } from './general-info'
import { LocationStep } from './location-info'
import { sensorSchema, SensorSelectionStep } from './sensors-info'
import { SummaryInfo } from './summary-info'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { Button } from '~/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { useToast } from '~/components/ui/use-toast'
import { DeviceModelEnum } from '~/db/schema/enum'
import { type loader } from '~/routes/device.new'
import { locationSchema, type LocationData } from '~/lib/location'
import { generalInfoSchema, type GeneralInfoData } from '~/lib/device-general'

const deviceSchema = z.object({
	model: z.enum(DeviceModelEnum.enumValues, {
		error: () => 'Please select a device.',
	}),
})

// selectedSensors can be an array of sensors
const sensorsSchema = z.object({
	selectedSensors: z
		.array(sensorSchema)
		.min(1, 'Please select at least one sensor'),
})

const advancedSchema = z.record(z.string(), z.any())

const formSchema = z.union([
	generalInfoSchema,
	locationSchema,
	deviceSchema,
	sensorsSchema,
	advancedSchema,
])

export const Stepper = defineStepper(
	{
		id: 'general-info',
		label: 'general_info',
		infoKey: 'general_information_text',
		schema: generalInfoSchema,
		index: 0,
	},
	{
		id: 'location',
		label: 'location',
		infoKey: 'location_info_text',
		schema: locationSchema,
		index: 1,
	},
	{
		id: 'device-selection',
		label: 'device_selection',
		infoKey: 'device_selection_info_text',
		schema: deviceSchema,
		index: 2,
	},
	{
		id: 'sensor-selection',
		label: 'sensor_selection',
		infoKey: 'sensor_selection_info_text',
		schema: sensorsSchema,
		index: 3,
	},
	{
		id: 'advanced',
		label: 'advanced',
		infoKey: null,
		schema: advancedSchema,
		index: 4,
	},
	{
		id: 'summary',
		label: 'summary',
		infoKey: null,
		schema: z.object({}),
		index: 5,
	},
)

type DeviceData = z.infer<typeof deviceSchema>
type SensorData = z.infer<typeof sensorsSchema>
type AdvancedData = z.infer<typeof advancedSchema>

type FormData =
	| GeneralInfoData
	| LocationData
	| DeviceData
	| SensorData
	| AdvancedData

export default function NewDeviceStepper() {
	const { integrations } = useLoaderData<typeof loader>()
	const submit = useSubmit()
	const [formData, setFormData] = useState<Record<string, any>>({})
	const stepper = Stepper.useStepper()
	const form = useForm({
		mode: 'onTouched',
		resolver: zodResolver<
			z.input<typeof formSchema>,
			any,
			z.output<typeof formSchema>
		>(stepper.state.current.data.schema),
	})
	const { toast } = useToast()
	const { t } = useTranslation('newdevice')
	const [isFirst, setIsFirst] = useState(false)
	const navigation = useNavigation()
	const isSubmitting = navigation.state === 'submitting'

	useEffect(() => {
		setIsFirst(stepper.state.isFirst)
	}, [stepper.state.isFirst])

	const onSubmit = (data: FormData) => {
		const updatedData = {
			...formData,
			[stepper.state.current.data.id]: data,
		}

		setFormData(updatedData)

		if (stepper.state.isLast) {
			void submit(
				{
					formData: JSON.stringify(updatedData),
				},
				{ method: 'post' },
			)
		} else {
			void stepper.navigation.next()
		}
	}

	const onError = (errors: FieldErrors<FormData>) => {
		const firstError = Object.values(errors)[0]

		let message: string | undefined

		if (firstError && 'message' in firstError) {
			message = firstError.message as string | undefined
		}

		if (message) {
			toast({
				title: 'Form Error',
				description: message,
				variant: 'destructive',
				duration: 2000,
			})
		}
	}

	return (
		<Stepper.Scoped>
			<FormProvider {...form}>
				<Form
					onSubmit={form.handleSubmit(onSubmit, onError)}
					className="flex h-full w-1/2 flex-col justify-between space-y-6 rounded-lg border bg-white p-6"
				>
					<div className="space-y-4">
						{/* Breadcrumb Navigation */}
						<Breadcrumb>
							<BreadcrumbList>
								{Stepper.steps.map((step, index) => {
									return (
										<div className="flex gap-2" key={index}>
											<BreadcrumbItem key={step.id}>
												<BreadcrumbLink
													onClick={() => stepper.navigation.goTo(step.id)}
													className={` ${
														stepper.state.current.index === step.index
															? 'font-bold text-black'
															: 'cursor-pointer text-gray-500 hover:text-black'
													} `}
												>
													{t(step.label)}
												</BreadcrumbLink>
											</BreadcrumbItem>

											{index < Stepper.steps.length - 1 && (
												<BreadcrumbSeparator>
													<Slash className="h-4 w-4" />
												</BreadcrumbSeparator>
											)}
										</div>
									)
								})}
							</BreadcrumbList>
						</Breadcrumb>

						{/* Step Header with Info */}
						<div className="flex items-center justify-start gap-2">
							<h2 className="text-lg font-medium">
								{t('step')} {stepper.state.current.index + 1} {t('of')}{' '}
								{Stepper.steps.length}: {t(stepper.state.current.data.label)}
							</h2>
							{stepper.state.current.data.infoKey && (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger
											type="button"
											onClick={(e) => {
												e.preventDefault()
												e.stopPropagation()
											}}
										>
											<Info />
										</TooltipTrigger>
										<TooltipContent>
											{t(stepper.state.current.data.infoKey)}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
						</div>
					</div>

					{/* Form Content */}
					<div className="h-full overflow-auto">
						{stepper.flow.switch({
							advanced: () => <AdvancedStep integrations={integrations} />,
							'general-info': () => <GeneralInfoStep />,
							location: () => <LocationStep />,
							'device-selection': () => <DeviceSelectionStep />,
							'sensor-selection': () => <SensorSelectionStep />,
							summary: () => <SummaryInfo />,
						})}
					</div>

					{/* Navigation Buttons */}
					<div className="mt-4 flex justify-between">
						<Button
							type="button"
							variant="secondary"
							onClick={() => stepper.navigation.prev()}
							disabled={isFirst || isSubmitting}
						>
							{t('back')}
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? t('submitting')
								: stepper.state.isLast
									? t('complete')
									: t('next')}
						</Button>
					</div>
				</Form>
			</FormProvider>
		</Stepper.Scoped>
	)
}
