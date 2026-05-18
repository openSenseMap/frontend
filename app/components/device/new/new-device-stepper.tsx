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
import { Stepper } from './stepper.config'
import { formSchema } from './schemas'

export default function NewDeviceStepper() {
	const { integrations } = useLoaderData<typeof loader>()
	const submit = useSubmit()
	const [formData, setFormData] = useState<Record<string, any>>({})
	const stepper = Stepper.useStepper()

	type StepVisualStatus =
		| 'current'
		| 'locked'
		| 'available'
		| 'valid'
		| 'invalid'

	const [highestUnlockedIndex, setHighestUnlockedIndex] = useState(0)
	const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set())
	const [stepErrors, setStepErrors] = useState<Partial<Record<StepId, string>>>(
		{},
	)
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

	const getStepStatus = (
		step: (typeof Stepper.steps)[number],
	): StepVisualStatus => {
		if (stepper.state.current.data.id === step.id) return 'current'
		if (stepErrors[step.id]) return 'invalid'
		if (completedSteps.has(step.id)) return 'valid'
		if (step.index > highestUnlockedIndex) return 'locked'

		return 'available'
	}

	const validateStep = async (stepId: StepId): Promise<boolean> => {
		const schema = stepSchemas[stepId]

		// Summary itself has no fields; final validation happens separately.
		if (stepId === 'summary') return true

		const result = schema.safeParse(form.getValues())

		if (!result.success) {
			const firstIssue = result.error.issues[0]
			const message = firstIssue?.message ?? t('please_fix_this_step')

			for (const issue of result.error.issues) {
				const fieldName = issue.path.join('.')

				if (fieldName) {
					form.setError(fieldName as any, {
						type: 'manual',
						message: issue.message,
					})
				}
			}

			setStepErrors((prev) => ({
				...prev,
				[stepId]: message,
			}))

			toast({
				title: t('form_error'),
				description: message,
				variant: 'destructive',
				duration: 3000,
			})

			return false
		}

		setStepErrors((prev) => {
			const next = { ...prev }
			delete next[stepId]
			return next
		})

		setCompletedSteps((prev) => {
			const next = new Set(prev)
			next.add(stepId)
			return next
		})

		return true
	}

	const handleStepClick = async (
		targetStep: (typeof Stepper.steps)[number],
	) => {
		const currentIndex = stepper.state.current.index
		const targetIndex = targetStep.index
		const targetStepId = targetStep.id as StepId

		// Always allow going backwards.
		if (targetIndex <= currentIndex) {
			stepper.navigation.goTo(targetStepId)
			return
		}

		// Future locked step.
		if (targetIndex > highestUnlockedIndex) {
			toast({
				title: t('step_locked'),
				description: t('complete_previous_steps_first'),
				variant: 'destructive',
				duration: 3000,
			})

			// Optional: validate current step immediately so the user sees why.
			await validateStep(stepper.state.current.data.id as StepId)

			return
		}

		// If previously unlocked, allow navigation.
		stepper.navigation.goTo(targetStepId)
	}

	function extractAdvancedValues(values: Record<string, any>) {
		const advanced: Record<string, any> = {}

		for (const [key, value] of Object.entries(values)) {
			if (key.endsWith('Enabled') || key.endsWith('Config')) {
				advanced[key] = value
			}
		}

		return advanced
	}

	function buildSubmitPayload(values: any) {
		return {
			'general-info': {
				name: values.name,
				description: values.description,
				exposure: values.exposure,
				temporaryExpirationDate: values.temporaryExpirationDate,
				tags: values.tags ?? [],
			},
			location: {
				latitude: values.latitude,
				longitude: values.longitude,
			},
			'device-selection': {
				model: values.model,
			},
			'sensor-selection': {
				selectedSensors: values.selectedSensors ?? [],
			},
			advanced: extractAdvancedValues(values),
		}
	}

	// const handleNextOrComplete = async () => {
	// 	const currentStep = stepper.state.current.data
	// 	const currentStepId = currentStep.id as StepId

	// 	if (currentStepId !== 'summary') {
	// 		const isValid = await validateStep(currentStepId)

	// 		if (!isValid) return

	// 		const nextIndex = stepper.state.current.index + 1

	// 		setHighestUnlockedIndex((prev) => Math.max(prev, nextIndex))
	// 		stepper.navigation.next()

	// 		return
	// 	}

	// 	const allValid = await validateAllSteps()

	// 	if (!allValid) return

	// 	const payload = buildSubmitPayload(form.getValues())

	// 	void submit(
	// 		{
	// 			formData: JSON.stringify(payload),
	// 		},
	// 		{ method: 'post' },
	// 	)
	// }

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
													onClick={() => void handleStepClick(step)}
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
