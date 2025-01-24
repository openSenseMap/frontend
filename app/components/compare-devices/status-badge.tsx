import { Badge } from '@/components/ui/badge'

export type StatusBadgeProps = {
	status: 'active' | 'inactive' | 'old'
}

export function StatusBadge({ status }: StatusBadgeProps) {
	const colorMap = {
		active: 'bg-green-500',
		inactive: 'bg-red-500',
		old: 'bg-yellow-500',
	}

	return <Badge className={`${colorMap[status]} text-white`}>{status}</Badge>
}
