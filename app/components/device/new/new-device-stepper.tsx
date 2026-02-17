import { zodResolver } from '@hookform/resolvers/zod'
import { defineStepper } from '@stepperize/react'
import { Info, Slash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type FieldErrors, FormProvider, useForm } from 'react-hook-form'
import { Form, useLoaderData, useSubmit } from 'react-router'
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
import { type loader } from '~/routes/device.new'
import { DeviceModelEnum } from '~/schema/enum'

const generalInfoSchema = z.object({
	name: z
		.string()
		.min(2, 'Name must be at least 2 characters')
		.min(1, 'Name is required'),
	exposure: z.enum(['indoor', 'outdoor', 'mobile', 'unknown'], {
		errorMap: () => ({ message: 'Exposure is required' }),
	}),
	temporaryExpirationDate: z
		.string()
		.optional()
		.transform((date) => (date ? new Date(date) : undefined)) // Transform string to Date
		.refine(
			(date) =>
				!date || date <= new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
			{
				message: 'Temporary expiration date must be within 1 month from now',
			},
		),
	tags: z
		.array(
			z.object({
				value: z.string(),
			}),
		)
		.optional(),
})

const locationSchema = z.object({
	latitude: z.coerce
		.number({
			invalid_type_error: 'Latitude must be a valid number',
			required_error: 'Latitude is required',
		})
		.min(-90, 'Latitude must be greater than or equal to -90')
		.max(90, 'Latitude must be less than or equal to 90'),
	longitude: z.coerce
		.number({
			invalid_type_error: 'Longitude must be a valid number',
			required_error: 'Longitude is required',
		})
		.min(-180, 'Longitude must be greater than or equal to -180')
		.max(180, 'Longitude must be less than or equal to 180'),
})

const deviceSchema = z.object({
	model: z.enum(DeviceModelEnum.enumValues, {
		errorMap: () => ({ message: 'Please select a device.' }),
	}),
})

// selectedSensors can be an array of sensors
const sensorsSchema = z.object({
	selectedSensors: z
		.array(sensorSchema)
		.min(1, 'Please select at least one sensor'),
})

const advancedSchema = z.record(z.any());

export const Stepper = defineStepper(
  {
    id: "general-info",
    label: "General Info",
    info: "Provide a unique name for your device, select its operating environment (outdoor, indoor, mobile, or unknown), and add relevant tags (optional).",
    schema: generalInfoSchema,
    index: 0
  },
  {
    id: "location",
    label: "Location",
    info: "Select the device's location by clicking on the map or entering latitude and longitude coordinates manually. Drag the marker on the map to adjust the location if needed.",
    schema: locationSchema,
    index: 1
  },
  {
    id: "device-selection",
    label: "Device Selection",
    info: "Select a device model from the available options",
    schema: deviceSchema,
    index: 2
  },
  {
    id: "sensor-selection",
    label: "Sensor Selection",
    info: "Select sensors for your device by choosing from predefined groups or individual sensors based on your device model. If using a custom device, configure sensors manually.",
    schema: sensorsSchema,
    index: 3
  },
  { id: "advanced", label: "Advanced", info: null,  schema: advancedSchema, index: 4 },
  { id: "summary", label: "Summary", info: null, schema: z.object({}), index: 5 },
);

type GeneralInfoData = z.infer<typeof generalInfoSchema>
type LocationData = z.infer<typeof locationSchema>
type DeviceData = z.infer<typeof deviceSchema>
type SensorData = z.infer<typeof sensorsSchema>
type AdvancedData = z.infer<typeof advancedSchema>

type FormData = GeneralInfoData &
	LocationData &
	DeviceData &
	SensorData &
	AdvancedData

export default function NewDeviceStepper() {
	const { integrations } = useLoaderData<typeof loader>();
	const submit = useSubmit()
	const [formData, setFormData] = useState<Record<string, any>>({})
	const stepper = Stepper.useStepper()
	const form = useForm<FormData>({
		mode: 'onTouched',
		resolver: zodResolver(stepper.current.schema),
	})
	const { toast } = useToast()
	const [isFirst, setIsFirst] = useState(false)

	useEffect(() => {
		setIsFirst(stepper.isFirst)
	}, [stepper.isFirst])

  const onSubmit = (data: FormData) => {
    const updatedData = {
      ...formData,
      [stepper.current.id]: data,
    };

		setFormData(updatedData)

    if (stepper.isLast) {
      // Submit form data as JSON
      void submit(
        {
          formData: JSON.stringify(updatedData),
        },
        { method: "post" },
      );
    } else {
      stepper.next();
    }
  };

	const onError = (errors: FieldErrors<FormData>) => {
		const firstError = Object.values(errors)[0];

		let message: string | undefined;

		if (firstError && "message" in firstError) {
			message = firstError.message as string | undefined;
		}

		if (message) {
			toast({
				title: "Form Error",
				description: message,
				variant: "destructive",
				duration: 2000,
			});
		}
	};

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
													onClick={() => stepper.goTo(step.id)}
													className={` ${
														stepper.current.index === step.index
															? 'font-bold text-black'
															: 'cursor-pointer text-gray-500 hover:text-black'
													} `}
												>
													{step.label}
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
								Step {stepper.current.index + 1} of {Stepper.steps.length}:{' '}
								{stepper.current.label}
							</h2>
							{stepper.current.info && (
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
										<TooltipContent>{stepper.current.info}</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
						</div>
					</div>

					{/* Form Content */}
					<div className="h-full overflow-auto">
						{stepper.switch({
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
							onClick={stepper.prev}
							disabled={isFirst}
						>
							Back
						</Button>
						<Button type="submit">
							{stepper.isLast ? 'Complete' : 'Next'}
						</Button>
					</div>
				</Form>
			</FormProvider>
		</Stepper.Scoped>
	)
}
