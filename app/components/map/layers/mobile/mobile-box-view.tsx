import { ArrowDownUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { calculateColorRange } from './color-palette'
import MobileBoxLayer from './mobile-box-layer'
import { Button } from '~/components/ui/button'
import { type Sensor } from '~/db/schema'

interface SensorWithColor extends Sensor {
	color: string // Add the color property
}

export default function MobileBoxView({
	sensors: initialSensors,
}: {
	sensors: SensorWithColor[]
}) {
	const [sensors, setSensors] = useState<SensorWithColor[]>(initialSensors)

	useEffect(() => {
		setSensors(initialSensors)
	}, [initialSensors])

	// Toggle the order of sensors
	const switchSensors = () => {
		setSensors((prevSensors) => [...prevSensors].reverse())
	}

	return (
		<div className="absolute top-80 right-0 flex max-h-[calc(100vh-21rem)] flex-col gap-4 overflow-y-auto p-4">
			{sensors.map((sensor, index) => (
				<div key={sensor.id} className="flex flex-col items-center gap-4">
					{index === 1 && sensors.length === 2 && (
						<Button
							className="self-center rounded-full px-4 py-2"
							onClick={switchSensors}
							variant={'outline'}
						>
							<ArrowDownUp />
						</Button>
					)}
					<SensorView sensor={sensor} index={index} />
				</div>
			))}
		</div>
	)
}

function SensorView({
	sensor,
	index,
}: {
	sensor: SensorWithColor
	index: number
}) {
	const { lowColor, highColor } = calculateColorRange(sensor.color) // Calculate dynamically

	const [minColor, setMinColor] = useState(lowColor)
	const [maxColor, setMaxColor] = useState(highColor)

	return (
		<>
			<Legend
				sensor={sensor}
				key={'Legend_' + sensor.id}
				onColorChange={(min, max) => {
					setMinColor(min)
					setMaxColor(max)
				}}
			/>
			{index < 1 && (
				<MobileBoxLayer
					sensor={sensor}
					key={sensor.id}
					minColor={minColor}
					maxColor={maxColor}
				/>
			)}
		</>
	)
}

function Legend({
	sensor,
	onColorChange,
}: {
	sensor: SensorWithColor
	onColorChange?: (min: string, max: string) => void
}) {
	const { t } = useTranslation('mobile-map')
	const { lowColor, highColor } = calculateColorRange(sensor.color)

	const minColorInputRef = useRef<HTMLInputElement>(null)
	const maxColorInputRef = useRef<HTMLInputElement>(null)

	const [minColor, setMinColor] = useState(lowColor)
	const [maxColor, setMaxColor] = useState(highColor)

	useEffect(() => {
		onColorChange?.(minColor, maxColor)
	}, [minColor, maxColor, onColorChange])

	const sensorData = Array.isArray(sensor.data)
		? sensor.data.filter(
				(measurement) =>
					measurement.value !== null &&
					Number.isFinite(Number(measurement.value)),
			)
		: []

	const minValue =
		sensorData.length > 0
			? Math.min(...sensorData.map((d) => Number(d.value)))
			: 0
	const maxValue =
		sensorData.length > 0
			? Math.max(...sensorData.map((d) => Number(d.value)))
			: 0

	return (
		<div className="z-50 flex w-40 flex-col gap-2 rounded-lg border-gray-200 bg-white p-2 shadow-xs">
			<span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
				{t('sensorValues')}
			</span>
			<span className="font-semibold">{sensor.title}</span>
			<div
				className="flex w-full items-center justify-between rounded-sm p-1"
				style={{
					background: `linear-gradient(90deg, ${minColor} 0%, ${maxColor} 100%)`,
				}}
			>
				<div
					className="cursor-pointer rounded bg-white px-0.5 shadow-xs"
					onClick={() => minColorInputRef.current?.click()}
				>
					{minValue}
					{sensor.unit}
					<input
						type="color"
						ref={minColorInputRef}
						className="hidden"
						value={minColor}
						onChange={(e) => setMinColor(e.target.value)}
					/>
				</div>
				<span
					className="cursor-pointer rounded bg-white px-0.5 shadow-xs"
					onClick={() => maxColorInputRef.current?.click()}
				>
					{maxValue}
					{sensor.unit}
					<input
						className="hidden"
						type="color"
						ref={maxColorInputRef}
						defaultValue={maxColor}
						onChange={(e) => setMaxColor(e.target.value)}
					/>
				</span>
			</div>
		</div>
	)
}
