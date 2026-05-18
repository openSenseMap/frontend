import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { stepSchemas } from '~/components/device/new/schemas'
import { Stepper } from '~/components/device/new/stepper.config'

type Step = (typeof Stepper.steps)[number]
export type StepId = Step['id']

export type StepStatus =
	| 'current'
	| 'current-invalid'
	| 'locked'
	| 'available'
	| 'valid'
	| 'invalid'

type Toast = (input: {
	title?: string
	description?: string
	variant?: 'default' | 'destructive'
	duration?: number
}) => void

type Submit = (
	target: { formData: string },
	options: { method: 'post' },
) => void

type AdvancedStepValidator = () => boolean | string | Promise<boolean | string>

type UseDeviceWizardArgs = {
	stepper: ReturnType<typeof Stepper.useStepper>
	form: UseFormReturn<any>
	submit: Submit
	toast: Toast
	t: (key: string) => string
	validateAdvancedStep?: AdvancedStepValidator
	buildPayload?: (values: any) => unknown
}

const STEP_FIELDS: Record<StepId, string[]> = {
	'general-info': [
		'name',
		'description',
		'exposure',
		'temporaryExpirationDate',
		'tags',
	],
	location: ['latitude', 'longitude'],
	'device-selection': ['model'],
	'sensor-selection': ['selectedSensors'],
	advanced: [],
	summary: [],
}

function defaultBuildPayload(values: any) {
	const advanced: Record<string, unknown> = {}

	for (const [key, value] of Object.entries(values)) {
		if (key.endsWith('Enabled') || key.endsWith('Config')) {
			advanced[key] = value
		}
	}

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
		advanced,
	}
}

export function useDeviceWizard({
	stepper,
	form,
	submit,
	toast,
	t,
	validateAdvancedStep,
	buildPayload = defaultBuildPayload,
}: UseDeviceWizardArgs) {
	const [highestUnlockedIndex, setHighestUnlockedIndex] = useState(0)
	const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(
		() => new Set(),
	)
	const [stepErrors, setStepErrors] = useState<Partial<Record<StepId, string>>>(
		{},
	)
	const [isBusy, setIsBusy] = useState(false)

	const currentStep = stepper.state.current.data
	const currentStepId = currentStep.id as StepId
	const currentIndex = stepper.state.current.index

	function text(key: string, fallback: string) {
		const translated = t(key)
		return translated && translated !== key ? translated : fallback
	}

	function markStepValid(stepId: StepId) {
		setStepErrors((previous) => {
			const next = { ...previous }
			delete next[stepId]
			return next
		})

		setCompletedSteps((previous) => {
			const next = new Set(previous)
			next.add(stepId)
			return next
		})

		for (const field of STEP_FIELDS[stepId]) {
			form.clearErrors(field)
		}
	}

	function markStepInvalid(stepId: StepId, message: string) {
		setStepErrors((previous) => ({
			...previous,
			[stepId]: message,
		}))

		setCompletedSteps((previous) => {
			const next = new Set(previous)
			next.delete(stepId)
			return next
		})
	}

	async function validateStep(
		stepId: StepId,
		options: { showToast?: boolean; focus?: boolean } = {},
	) {
		const showToast = options.showToast ?? true
		const focus = options.focus ?? true

		if (stepId === 'summary') {
			return true
		}

		if (stepId === 'advanced') {
			if (!validateAdvancedStep) {
				markStepValid(stepId)
				return true
			}

			const result = await validateAdvancedStep()

			if (result === true) {
				markStepValid(stepId)
				return true
			}

			const message =
				typeof result === 'string'
					? result
					: text(
							'advanced_configuration_invalid',
							'Please check the advanced configuration.',
						)

			markStepInvalid(stepId, message)

			if (showToast) {
				toast({
					title: text('form_error', 'Form Error'),
					description: message,
					variant: 'destructive',
					duration: 3000,
				})
			}

			return false
		}

		const schema = stepSchemas[stepId]
		const result = schema.safeParse(form.getValues())

		if (result.success) {
			markStepValid(stepId)
			return true
		}

		const firstIssue = result.error.issues[0]
		const message =
			firstIssue?.message ??
			text('please_fix_this_step', 'Please fix this step before continuing.')

		for (const issue of result.error.issues) {
			const fieldName = issue.path.join('.')

			if (!fieldName) continue

			form.setError(fieldName, {
				type: 'manual',
				message: issue.message,
			})
		}

		markStepInvalid(stepId, message)

		if (focus) {
			const firstField = firstIssue?.path.join('.')

			if (firstField) {
				try {
					form.setFocus(firstField)
				} catch {
					// Custom fields like maps, buttons, or RJSF widgets may not be focusable.
				}
			}
		}

		if (showToast) {
			toast({
				title: text('form_error', 'Form Error'),
				description: message,
				variant: 'destructive',
				duration: 3000,
			})
		}

		return false
	}

	async function validateStepsBefore(targetIndex: number) {
		let firstInvalidStep: Step | undefined

		for (const step of Stepper.steps) {
			if (step.index >= targetIndex) break
			if (step.id === 'summary') continue

			const isValid = await validateStep(step.id as StepId, {
				showToast: !firstInvalidStep,
				focus: !firstInvalidStep,
			})

			if (!isValid && !firstInvalidStep) {
				firstInvalidStep = step
			}
		}

		if (firstInvalidStep) {
			stepper.navigation.goTo(firstInvalidStep.id as StepId)
			return false
		}

		return true
	}

	async function validateAllSteps() {
		return validateStepsBefore(Stepper.steps.length)
	}

	async function handleNext() {
		if (isBusy) return

		setIsBusy(true)

		try {
			const isValid = await validateStep(currentStepId)

			if (!isValid) return

			setHighestUnlockedIndex((previous) =>
				Math.max(previous, currentIndex + 1),
			)

			stepper.navigation.next()
		} finally {
			setIsBusy(false)
		}
	}

	function handleBack() {
		if (stepper.state.isFirst) return
		stepper.navigation.prev()
	}

	async function handleComplete() {
		if (isBusy) return

		setIsBusy(true)

		try {
			const isValid = await validateAllSteps()

			if (!isValid) return

			const payload = buildPayload(form.getValues())

			submit(
				{
					formData: JSON.stringify(payload),
				},
				{ method: 'post' },
			)
		} finally {
			setIsBusy(false)
		}
	}

	async function handleFormSubmit(event?: SyntheticEvent<HTMLFormElement>) {
		event?.preventDefault()

		if (stepper.state.isLast) {
			await handleComplete()
		} else {
			await handleNext()
		}
	}

	async function handleStepClick(targetStep: Step) {
		if (isBusy) return

		const targetIndex = targetStep.index
		const targetStepId = targetStep.id as StepId

		// Same step: nothing to do.
		if (targetIndex === currentIndex) return

		// Backward navigation is always allowed.
		if (targetIndex < currentIndex) {
			stepper.navigation.goTo(targetStepId)
			return
		}

		// Future locked step: block and warn.
		if (targetIndex > highestUnlockedIndex) {
			await validateStep(currentStepId, {
				showToast: false,
				focus: false,
			})

			toast({
				title: text('step_locked', 'Step locked'),
				description: text(
					'complete_previous_steps_first',
					'Please complete the previous steps before jumping ahead.',
				),
				variant: 'destructive',
				duration: 3000,
			})

			return
		}

		// Forward but already unlocked: re-check previous steps first.
		setIsBusy(true)

		try {
			const previousStepsValid = await validateStepsBefore(targetIndex)

			if (!previousStepsValid) return

			stepper.navigation.goTo(targetStepId)
		} finally {
			setIsBusy(false)
		}
	}

	function getStepStatus(step: Step): StepStatus {
		const stepId = step.id as StepId
		const hasError = Boolean(stepErrors[stepId])
		const isCurrent = stepId === currentStepId
		const isLocked = step.index > highestUnlockedIndex

		if (isCurrent && hasError) return 'current-invalid'
		if (isCurrent) return 'current'
		if (hasError) return 'invalid'
		if (completedSteps.has(stepId)) return 'valid'
		if (isLocked) return 'locked'

		return 'available'
	}

	function isStepLocked(step: Step) {
		return step.index > highestUnlockedIndex
	}

	return {
		highestUnlockedIndex,
		completedSteps,
		stepErrors,
		isBusy,

		currentStep,
		currentStepId,
		currentIndex,

		validateStep,
		validateAllSteps,

		handleBack,
		handleNext,
		handleComplete,
		handleFormSubmit,
		handleStepClick,

		getStepStatus,
		isStepLocked,
	}
}
