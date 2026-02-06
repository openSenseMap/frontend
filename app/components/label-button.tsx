export function LabelButton({
	...props
}: Omit<React.ComponentPropsWithoutRef<'label'>, 'className'>) {
	return <label {...props} />
}
