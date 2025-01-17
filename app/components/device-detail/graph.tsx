import {
	Chart as ChartJS,
	LineElement,
	TimeScale,
	CategoryScale,
	LinearScale,
	PointElement,
	Legend,
	Tooltip as ChartTooltip,
	Filler,
	type ChartOptions,
} from 'chart.js'
import 'chartjs-adapter-date-fns'
// import { de, enGB } from "date-fns/locale";
import { Download, RefreshCcw, X } from 'lucide-react'
import { useMemo, useRef, useState, useEffect, useContext } from 'react'
import { Line } from 'react-chartjs-2'
import { isBrowser, isTablet } from 'react-device-detect'
import Draggable, { type DraggableData } from 'react-draggable'
import { useNavigate, useNavigation, useSearchParams } from 'react-router'
import { AggregationFilter } from '../aggregation-filter'
import { ClientOnly } from '../client-only'
import { ColorPicker } from '../color-picker'
import { DateRangeFilter } from '../daterange-filter'
import { HoveredPointContext } from '../map/layers/mobile/mobile-box-layer'
import Spinner from '../spinner'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../ui/tooltip'
import { datesHave48HourRange } from '~/lib/utils'

ChartJS.register(
	LineElement,
	TimeScale,
	CategoryScale,
	LinearScale,
	PointElement,
	ChartTooltip,
	Legend,
	Filler,
)

// ClientOnly component to handle the plugin that needs window
const GraphWithZoom = (props: any) => {
	useMemo(() => {
		// Dynamically import the zoom plugin
		void import('chartjs-plugin-zoom').then(({ default: zoomPlugin }) => {
			ChartJS.register(zoomPlugin)
		})
	}, [])

	return (
		<Line
			data={props.lineData}
			options={props.options}
			ref={props.chartRef}
		></Line>
	)
}

interface GraphProps {
	aggregation: string
	sensors: any[]
	startDate?: string
	endDate?: string
}

export default function Graph({
	aggregation,
	sensors,
	startDate,
	endDate,
}: GraphProps) {
	const { setHoveredPoint } = useContext(HoveredPointContext)
	const navigation = useNavigation()
	const navigate = useNavigate()
	const [offsetPositionX, setOffsetPositionX] = useState(0)
	const [offsetPositionY, setOffsetPositionY] = useState(0)
	const [currentZoom, setCurrentZoom] = useState<{
		xMin: number
		xMax: number
	} | null>(null) // To track zoom
	const [searchParams, setSearchParams] = useSearchParams()
	const [colorPickerState, setColorPickerState] = useState({
		open: false,
		index: 0,
		color: '#000000',
	})
	const isAggregated = aggregation !== 'raw'

	const nodeRef = useRef<HTMLDivElement>(null)
	const chartRef = useRef<ChartJS<'line'>>(null)

	useEffect(() => {
		if (chartRef.current) {
			const canvas = chartRef.current.canvas

			const handleMouseLeave = () => {
				setHoveredPoint(null) // Clear the hovered point when the mouse leaves the chart area
			}

			canvas.addEventListener('mouseleave', handleMouseLeave)

			// Cleanup
			return () => {
				canvas.removeEventListener('mouseleave', handleMouseLeave)
			}
		}
	}, [chartRef, setHoveredPoint])

	// get theme from tailwind
	const [theme] = 'light' //useTheme();

	const [lineData, setLineData] = useState(() => {
		const includeDeviceName =
			sensors.length === 2 && sensors[0].device_name !== sensors[1].device_name

		return {
			datasets: sensors
				.map(
					(
						sensor: {
							title: any
							device_name: any
							data: any[]
							color: string
						},
						index: number,
					) => {
						const baseDataset = {
							label: includeDeviceName
								? `${sensor.title} (${sensor.device_name})`
								: sensor.title,
							data: sensor.data.map((measurement) => ({
								x: measurement.time,
								y: measurement.value,
								locationId: measurement.locationId,
							})),
							pointRadius: 0,
							borderColor: sensor.color,
							backgroundColor: sensor.color,
							yAxisID: index === 0 ? 'y' : 'y1',
							fill: false,
							tension: 0.4,
						}

						if (isAggregated && sensors.length === 1) {
							const minDataset = {
								...baseDataset,
								label: `${baseDataset.label} (Min)`,
								data: sensor.data.map((measurement) => ({
									x: measurement.time,
									y: measurement.min_value,
									locationId: null,
								})),
								borderColor: sensor.color + '33',
								backgroundColor: sensor.color + '33',
								fill: 1,
							}

							const maxDataset = {
								...baseDataset,
								label: `${baseDataset.label} (Max)`,
								data: sensor.data.map((measurement) => ({
									x: measurement.time,
									y: measurement.max_value,
									locationId: null,
								})),
								borderColor: sensor.color + '33',
								backgroundColor: sensor.color + '33',
								fill: 1,
							}

							return [maxDataset, baseDataset, minDataset]
						}

						return [baseDataset]
					},
				)
				.flat(),
		}
	})

	useEffect(() => {
		const includeDeviceName =
			sensors.length === 2 && sensors[0].device_name !== sensors[1].device_name

		setLineData({
			datasets: sensors
				.map(
					(
						sensor: {
							title: any
							device_name: any
							data: any[]
							color: string
						},
						index: number,
					) => {
						const baseDataset = {
							label: includeDeviceName
								? `${sensor.title} (${sensor.device_name})`
								: sensor.title,
							data: sensor.data.map((measurement) => ({
								x: measurement.time,
								y: measurement.value,
								locationId: measurement.locationId,
							})),
							pointRadius: 0,
							borderColor: sensor.color,
							backgroundColor: sensor.color,
							yAxisID: index === 0 ? 'y' : 'y1',
							fill: false,
							tension: 0.4,
						}

						if (isAggregated && sensors.length === 1) {
							const minDataset = {
								...baseDataset,
								label: `${baseDataset.label} (Min)`,
								data: sensor.data.map((measurement) => ({
									x: measurement.time,
									y: measurement.min_value,
									locationId: null,
								})),
								borderColor: sensor.color + '33',
								backgroundColor: sensor.color + '33',
								fill: 1,
							}

							const maxDataset = {
								...baseDataset,
								label: `${baseDataset.label} (Max)`,
								data: sensor.data.map((measurement) => ({
									x: measurement.time,
									y: measurement.max_value,
									locationId: null,
								})),
								borderColor: sensor.color + '33',
								backgroundColor: sensor.color + '33',
								fill: 1,
							}

							return [maxDataset, baseDataset, minDataset]
						}

						return [baseDataset]
					},
				)
				.flat(),
		})
	}, [sensors, isAggregated])

	const options: ChartOptions<'line'> = useMemo(() => {
		return {
			maintainAspectRatio: false,
			responsive: true,
			spanGaps: false,
			interaction: {
				mode: 'index',
				intersect: false,
			},
			parsing: {
				xAxisKey: 'x',
				yAxisKey: 'y',
			},
			scales: {
				x: {
					type: 'time',
					time: {
						unit: datesHave48HourRange(
							startDate ? new Date(startDate) : new Date(),
							endDate ? new Date(endDate) : new Date(),
						)
							? 'hour'
							: 'day',
						displayFormats: {
							day: 'dd.MM.yyyy',
							millisecond: 'mm:ss',
							second: 'mm:ss',
							minute: 'HH:mm',
							hour: 'HH:mm',
						},
						tooltipFormat: 'dd.MM.yyyy HH:mm',
					},
					// adapters: {
					//   date: {
					//     locale: data.locale === "de" ? de : enGB,
					//   },
					// },
					min: currentZoom?.xMin,
					max: currentZoom?.xMax,
					ticks: {
						major: {
							enabled: true,
						},
						font: (context) => {
							if (context.tick && context.tick.major) {
								return {
									weight: 'bold',
								}
							}
						},
						maxTicksLimit: 8,
					},
					grid: {
						color:
							theme === 'dark' ? 'rgba(255, 255, 255)' : 'rgba(0, 0, 0, 0.1)',
						borderColor:
							theme === 'dark' ? 'rgba(255, 255, 255)' : 'rgba(0, 0, 0, 0.1)',
					},
				},
				y: {
					title: {
						display: true,
						text: sensors[0].title + ' in ' + sensors[0].unit,
					},
					type: 'linear',
					display: true,
					position: 'left',
					grid: {
						color:
							theme === 'dark' ? 'rgba(255, 255, 255)' : 'rgba(0, 0, 0, 0.1)',
						borderColor:
							theme === 'dark' ? 'rgba(255, 255, 255)' : 'rgba(0, 0, 0, 0.1)',
					},
				},
				y1: {
					title: {
						display: true,
						text: sensors[1] ? sensors[1].title + ' in ' + sensors[1].unit : '', //data.sensors[1].unit
					},
					type: 'linear',
					display: 'auto',
					position: 'right',
					grid: {
						drawOnChartArea: false,
					},
				},
			},
			plugins: {
				tooltip: {
					enabled: true,
					mode: 'index',
					intersect: false,
					callbacks: {
						label: (context: any) => {
							const dataIndex = context.dataIndex
							const datasetIndex = context.datasetIndex
							const point = lineData.datasets[datasetIndex].data[dataIndex]
							const locationId = point.locationId
							setHoveredPoint(locationId)
							return `${context.dataset.label}: ${context.raw.y}`
						},
					},
				},
				zoom: {
					zoom: {
						wheel: {
							enabled: true,
						},
						drag: {
							enabled: true,
						},
						mode: 'x',
						onZoom: ({ chart }) => {
							const xScale = chart.scales['x']
							const xMin = xScale.min
							const xMax = xScale.max

							// Track the zoom level
							setCurrentZoom({ xMin, xMax })
						},
					},
				},
				legend: {
					display: true,
					position: 'bottom',
					onHover: (e, legendItem, legend) => {
						const canvas = legend.chart.canvas // Access the chart from the legend context

						// Only change the cursor and add the tooltip when hovering over the color box
						if (legendItem.fillStyle) {
							canvas.style.cursor = 'pointer'
							canvas.title = 'Click to change color' // Tooltip on legend color box
						}
					},
					onLeave: (e, legendItem, legend) => {
						const canvas = legend.chart.canvas
						canvas.style.cursor = 'default'
						canvas.title = '' // Remove tooltip on leave
					},

					onClick: (e, legendItem, _legend) => {
						const index = legendItem.datasetIndex ?? 0
						setColorPickerState({
							open: !colorPickerState.open,
							index,
							color: lineData.datasets[index].borderColor as string,
						})
					},
					labels: {
						usePointStyle: true,
					},
				},
			},
		}
	}, [
		startDate,
		endDate,
		currentZoom?.xMin,
		currentZoom?.xMax,
		theme,
		sensors,
		lineData.datasets,
		setHoveredPoint,
		colorPickerState.open,
	])

	function handleColorChange(newColor: string) {
		const updatedDatasets = [...lineData.datasets]
		updatedDatasets[colorPickerState.index].borderColor = newColor
		updatedDatasets[colorPickerState.index].backgroundColor = newColor

		// Update the lineData state with the new dataset colors
		setLineData((prevData) => ({
			...prevData,
			datasets: updatedDatasets,
		}))
	}

	function handlePngDownloadClick() {
		if (chartRef.current) {
			const imageString = chartRef.current.canvas.toDataURL('image/png', 1.0)

			// Create a temporary link element
			const link = document.createElement('a')
			link.href = imageString // Set the href to the data URL
			link.download = 'chart.png' // Specify the download file name

			// Append the link to the document body
			document.body.appendChild(link)

			// Programmatically click the link to trigger the download
			link.click()

			// Clean up and remove the link from the document
			document.body.removeChild(link)
		}
	}

	function handleCsvDownloadClick() {
		const labels = lineData.datasets[0].data.map((point: any) => point.x)

		let csvContent = 'timestamp,deviceId,sensorId,value,unit,phenomena\n'

		// Loop through each timestamp and sensor data
		labels.forEach((timestamp: any, index: string | number) => {
			sensors.forEach((sensor: any) => {
				const dataset = lineData.datasets.find(
					(ds: { label: string | any[] }) => ds.label.includes(sensor.title),
				)
				if (dataset) {
					const value = (dataset.data as any)[index]?.y ?? ''

					csvContent += `${timestamp},`
					csvContent += `${sensor.deviceId},`
					csvContent += `${sensor.id},`
					csvContent += `${value},`
					csvContent += `${sensor.unit},`
					csvContent += `${sensor.title}\n`
				}
			})
		})

		// Create a Blob from the CSV content
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

		// Create a temporary link element
		const link = document.createElement('a')
		const url = URL.createObjectURL(blob) // Create a URL for the Blob

		link.href = url // Set the href to the Blob URL
		link.download = 'chart_data.csv' // Specify the download file name

		// Append the link to the document body
		document.body.appendChild(link)

		// Programmatically click the link to trigger the download
		link.click()

		// Clean up and remove the link from the document
		document.body.removeChild(link)
		URL.revokeObjectURL(url) // Clean up the URL object
	}

	function handleResetZoomClick() {
		if (chartRef.current) {
			chartRef.current.resetZoom() // Use the resetZoom function from the zoom plugin
			setCurrentZoom(null) // Reset the zoom state
		}
	}

	function handleDrag(_e: any, data: DraggableData) {
		setOffsetPositionX(data.x)
		setOffsetPositionY(data.y)
	}

	return (
		<>
			<Draggable
				nodeRef={nodeRef as React.RefObject<HTMLDivElement>}
				bounds="#osem"
				handle="#graphTop"
				defaultPosition={{ x: offsetPositionX, y: offsetPositionY }}
				onDrag={handleDrag}
				disabled={!isBrowser && !isTablet}
			>
				<div
					ref={nodeRef}
					className="shadow-zinc-800/5 ring-zinc-900/5 absolute bottom-6 right-4 top-14 z-40 flex flex-col gap-4 rounded-xl bg-white px-4 pt-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95 dark:ring-white dark:backdrop-blur-sm md:bottom-[30px] md:left-auto md:right-4 md:top-auto md:h-[35%] md:max-h-[35%] md:w-[60vw]"
				>
					{navigation.state === 'loading' && (
						<div className="bg-gray-100/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[1.5px]">
							<Spinner />
						</div>
					)}
					<div
						className="flex cursor-move items-center justify-between px-2 pt-2"
						id="graphTop"
					>
						<div className="flex items-center justify-center gap-4">
							<DateRangeFilter />
							<AggregationFilter />
						</div>
						<div className="flex items-center justify-end gap-4">
							{currentZoom !== null &&
								currentZoom.xMax !== 0 &&
								currentZoom.xMin !== 0 && (
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger>
												<RefreshCcw
													onClick={handleResetZoomClick}
													className="cursor-pointer"
												/>
											</TooltipTrigger>
											<TooltipContent>
												<p>Reset zoom</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								)}
							<DropdownMenu>
								<DropdownMenuTrigger>
									<Download />
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem onClick={handlePngDownloadClick}>
										PNG
									</DropdownMenuItem>
									{sensors.length < 2 && (
										<DropdownMenuItem onClick={handleCsvDownloadClick}>
											CSV
										</DropdownMenuItem>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
							<X
								className="cursor-pointer"
								onClick={() => {
									searchParams.delete('date_to')
									searchParams.delete('date_from')
									searchParams.delete('aggregation')
									setSearchParams(searchParams)
									void navigate({
										pathname: `/explore/${sensors[0].deviceId}`,
										search: searchParams.toString(),
									})
								}}
							/>
						</div>
					</div>
					<div className="flex h-full w-full items-center justify-center">
						{(sensors[0].data.length === 0 && sensors[1] === undefined) ||
						(sensors[0].data.length === 0 && sensors[1].data.length === 0) ? (
							<div>There is no data for the selected time period.</div>
						) : (
							<ClientOnly fallback={<Spinner />}>
								{() => (
									<GraphWithZoom
										lineData={lineData}
										options={options}
										chartRef={chartRef} // Pass chartRef as a prop
									/>
								)}
							</ClientOnly>
						)}
					</div>
					{/* Overlay when the color picker is open */}
					{colorPickerState.open && (
						<>
							<div className="absolute inset-0 z-50 bg-black opacity-50"></div>{' '}
							{/* This is the overlay */}
							<div
								className="absolute z-50 rounded bg-white dark:bg-zinc-800"
								style={{
									left: '50%',
									top: '50%',
									transform: 'translate(-50%, -50%)', // Centers the color picker
								}}
							>
								<ColorPicker
									handleColorChange={handleColorChange}
									colorPickerState={colorPickerState}
									setColorPickerState={setColorPickerState}
								/>
							</div>
						</>
					)}
				</div>
			</Draggable>
		</>
	)
}
