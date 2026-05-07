import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '~/components/ui/command'
import { Label } from '~/components/ui/label'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/ui/popover'
import { cn } from '~/lib/utils'

interface MultiSelectComboboxFilterProps {
	label: string
	values: string[]
	options: string[]
	placeholder: string
	searchPlaceholder: string
	emptyText: string
	onChange: (values: string[]) => void
}

export default function MultiSelectComboboxFilter({
	label,
	values,
	options,
	placeholder,
	searchPlaceholder,
	emptyText,
	onChange,
}: MultiSelectComboboxFilterProps) {
	const toggleValue = (value: string) => {
		if (values.includes(value)) {
			onChange(values.filter((current) => current !== value))
			return
		}

		onChange([...values, value])
	}

	const removeValue = (value: string) => {
		onChange(values.filter((current) => current !== value))
	}

	return (
		<div className="grid gap-1.5 md:grid-cols-[5.5rem_1fr] md:items-start">
			<Label className="pt-2 text-sm text-gray-600 dark:text-zinc-400">
				{label}
			</Label>

			<div className="min-w-0 space-y-2">
				<Popover>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="outline"
							role="combobox"
							className="h-8 w-full justify-between px-2 text-sm font-normal"
						>
							<span className="truncate">
								{values.length > 0
									? `${values.length} selected`
									: placeholder}
							</span>

							<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>

					<PopoverContent
						align="start"
						className="w-[--radix-popover-trigger-width] p-0"
					>
						<Command>
							<CommandInput placeholder={searchPlaceholder} />

							<CommandList>
								<CommandEmpty>{emptyText}</CommandEmpty>

								<CommandGroup>
									{options.map((option) => {
										const selected = values.includes(option)

										return (
											<CommandItem
												key={option}
												value={option}
												onSelect={() => toggleValue(option)}
											>
												<Check
													className={cn(
														'mr-2 h-4 w-4',
														selected ? 'opacity-100' : 'opacity-0',
													)}
												/>

												<span className="truncate">{option}</span>
											</CommandItem>
										)
									})}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>

				{values.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{values.map((value) => (
							<Badge key={value} variant="secondary" className="text-xs">
								<span className="max-w-40 truncate">{value}</span>

								<button
									type="button"
									onClick={() => removeValue(value)}
									className="ml-1 rounded-full hover:text-destructive"
									aria-label={`Remove ${value}`}
								>
									<X className="h-3 w-3" />
								</button>
							</Badge>
						))}
					</div>
				)}
			</div>
		</div>
	)
}