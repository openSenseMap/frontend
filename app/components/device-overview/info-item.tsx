const InfoItem = ({
	icon: Icon,
	title,
	text,
}: {
	icon: React.ElementType
	title: string
	text?: string
}) =>
	text && (
		<div className="space-y-1">
			<div className="text-sm font-medium text-muted-foreground">{title}</div>
			<div className="flex items-center space-x-2 text-sm">
				<Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
				<span>{text}</span>
			</div>
		</div>
	)

export default InfoItem
