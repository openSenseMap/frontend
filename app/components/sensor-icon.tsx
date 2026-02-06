import { Activity, ThermometerIcon, Volume1Icon } from 'lucide-react'

interface SensorIconProps {
	title: string
	className: string | undefined
}

export default function SensorIcon(props: SensorIconProps) {
	switch (props.title.toLowerCase()) {
		case 'temperatur':
			return <ThermometerIcon className={props.className} />
		case 'lautstärke':
			return <Volume1Icon className={props.className} />
		default:
			return <Activity className={props.className} />
	}
}
