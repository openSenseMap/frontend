import {
	Wifi,
	ThermometerIcon,
	WindIcon,
	Droplets,
	Tornado,
	SunMoonIcon,
	MicIcon,
} from 'lucide-react'

const iconsList = [
	{ id: 'ThermometerIcon', name: ThermometerIcon },
	{ id: 'Wifi', name: Wifi },
	{ id: 'WindIcon', name: WindIcon },
	{ id: 'Droplets', name: Droplets },
	{ id: 'Tornado', name: Tornado },
	{ id: 'SunMoonIcon', name: SunMoonIcon },
	{ id: 'MicIcon', name: MicIcon },
]

function getIcon(iconName: string) {
	switch (iconName) {
		case 'ThermometerIcon':
			return (
				<ThermometerIcon className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
			)
		case 'Wifi':
			return (
				<Wifi className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
			)
		case 'WindIcon':
			return (
				<WindIcon className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
			)
		case 'Droplets':
			return (
				<Droplets className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
			)
		case 'Tornado':
			return (
				<Tornado className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
			)
		case 'SunMoonIcon':
			return (
				<SunMoonIcon className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
			)
		case 'MicIcon':
			return (
				<MicIcon className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
			)
	}
}

function assignIcon(sensorType: string, sensorTitle: string) {
	if (
		(sensorType === 'HDC1008' || sensorType === 'DHT11') &&
		sensorTitle === 'Temperatur'
	) {
		return (
			<ThermometerIcon className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
		)
	} else if (
		sensorType === 'HDC1008' ||
		sensorTitle === 'rel. Luftfeuchte' ||
		sensorTitle === 'Luftfeuchtigkeit'
	) {
		return (
			<Droplets className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
		)
	} else if (sensorType === 'LM386') {
		return (
			<ThermometerIcon className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
		)
	} else if (sensorType === 'BMP280' && sensorTitle === 'Luftdruck') {
		return (
			<ThermometerIcon className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
		)
	} else if (sensorType === 'TSL45315' || sensorType === 'VEML6070') {
		return (
			<SunMoonIcon className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
		)
	} else
		return (
			<ThermometerIcon className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
		)
}

export { iconsList, getIcon, assignIcon }
