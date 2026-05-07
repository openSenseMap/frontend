import MultiSelectComboboxFilter from "~/components/ui/combobox-filter"

interface FilterPhenomenaProps {
	phenomena: string[]
	availablePhenomena: string[]
	onPhenomenaChange: (phenomena: string[]) => void
}

export default function FilterPhenomena({
	phenomena,
	availablePhenomena,
	onPhenomenaChange,
}: FilterPhenomenaProps) {
	return (
		<MultiSelectComboboxFilter
			label="Phenomenon"
			values={phenomena}
			options={availablePhenomena}
			placeholder="Select phenomena"
			searchPlaceholder="Search phenomena..."
			emptyText="No phenomena found."
			onChange={onPhenomenaChange}
		/>
	)
}