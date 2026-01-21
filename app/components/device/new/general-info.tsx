import { Plus, Cloud, Home, HelpCircle, Bike, X, Info } from 'lucide-react'
import React, { useState } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '~/components/ui/tooltip'

type ExposureOption = 'outdoor' | 'indoor' | 'mobile' | 'unknown'

export function GeneralInfoStep() {
	const { register, control, setValue, getValues, watch } = useFormContext()
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'tags', // Tags array
	})

	const currentExposure = watch('exposure') // Watch exposure value

	// State for temporary expiration date
	const [temporaryExpirationDate, setTemporaryExpirationDate] = useState<
		string | null
	>(watch('temporaryExpirationDate') || null)

	const maxExpirationDate = new Date()
	maxExpirationDate.setMonth(maxExpirationDate.getMonth() + 1)

	const handleTemporaryChange = (checked: boolean) => {
		if (checked) {
			const newDate = maxExpirationDate.toISOString().split('T')[0]
			setTemporaryExpirationDate(newDate) // Update local state
			setValue('temporaryExpirationDate', newDate) // Update form value
		} else {
			setTemporaryExpirationDate(null) // Clear local state
			setValue('temporaryExpirationDate', '') // Clear form value
		}
	}

	const handleExpirationDateChange = (date: string) => {
		setTemporaryExpirationDate(date) // Update local state
		setValue('temporaryExpirationDate', date) // Update form value
	}

	const addTag = (event: React.FormEvent) => {
		event.preventDefault()
		const tagInput = document.getElementById('tag-input') as HTMLInputElement
		if (tagInput?.value.trim()) {
			append({ value: tagInput.value.trim() }) // Append a new tag object
			tagInput.value = '' // Clear input
		}
	}

	const exposureOptions: {
		value: ExposureOption
		icon: React.ReactNode
		label: string
	}[] = [
		{ value: 'outdoor', icon: <Cloud className="h-6 w-6" />, label: 'Outdoor' },
		{ value: 'indoor', icon: <Home className="h-6 w-6" />, label: 'Indoor' },
		{
			value: 'mobile',
			icon: <Bike className="h-6 w-6" />,
			label: 'Mobile',
		},
		{
			value: 'unknown',
			icon: <HelpCircle className="h-6 w-6" />,
			label: 'Unknown',
		},
	]

	return (
		<div className="flex h-full flex-col justify-evenly space-y-4 p-2">
			<div>
				<Label htmlFor="name">Name</Label>
				<Input
					defaultValue={watch('name')} // Set default value from form state
					id="name"
					{...register('name')}
					className="w-full rounded-md border p-2"
				/>
			</div>
			<div>
				<Label htmlFor="exposure">Exposure</Label>
				<div className="mt-2 flex flex-wrap gap-2">
					{exposureOptions.map((option) => (
						<Button
							key={option.value}
							type="button" // Prevent form submission
							onClick={() => setValue('exposure', option.value)}
							variant={'outline'}
							className={`flex items-center gap-2 transition-all duration-200 ease-in-out ${
								currentExposure === option.value
									? 'bg-green-100 shadow-md hover:bg-green-100'
									: 'hover:bg-gray-100'
							}`}
						>
							{option.icon}
							<span className="text-sm">{option.label}</span>
						</Button>
					))}
				</div>
			</div>
			<div className="space-y-2">
				<div className="flex items-center space-x-4">
					<div className="flex items-center space-x-2">
						<Checkbox
							id="isTemporary"
							checked={!!temporaryExpirationDate}
							onCheckedChange={handleTemporaryChange}
						/>
						<Label htmlFor="isTemporary" className="text-base font-medium">
							Temporary Device
						</Label>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger
									type="button"
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
									}}
								>
									{/*Treat it as a normal button, rather than treating it as a Submit button*/}
									<Info />
								</TooltipTrigger>
								<TooltipContent>
									{
										<p className="text-sm text-gray-500">
											Temporary devices will be automatically deleted after a
											maximum of one month.
										</p>
									}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					{temporaryExpirationDate && (
						<div className="flex flex-grow items-center space-x-2">
							<Label
								htmlFor="temporaryExpirationDate"
								className="whitespace-nowrap text-sm font-medium"
							>
								Expiration Date:
							</Label>
							<Input
								type="date"
								id="temporaryExpirationDate"
								value={temporaryExpirationDate}
								onChange={(e) => handleExpirationDateChange(e.target.value)}
								min={new Date().toISOString().split('T')[0]}
								max={maxExpirationDate.toISOString().split('T')[0]}
								className="flex-grow rounded-md border p-2"
							/>
						</div>
					)}
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="tag-input" className="text-base">
					Tags:
				</Label>
				<div className="flex space-x-2">
					<Input
						id="tag-input"
						type="text"
						placeholder="Add a tag"
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault()
								addTag(e) // Call addTag on Enter key
							}
						}}
					/>
					<Button variant={'outline'} onClick={addTag} aria-label="Add tag">
						<Plus className="h-4 w-4" />
					</Button>
				</div>
				<div className="flex flex-wrap gap-2 pt-2">
					{fields.map((field, index) => (
						<Badge
							key={field.id}
							variant="secondary"
							className="flex items-center text-sm"
						>
							{getValues(`tags.${index}.value`)}
							<button
								onClick={() => remove(index)}
								className="ml-2 flex items-center justify-center text-xs"
								aria-label="Remove tag"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			</div>
		</div>
	)
}
