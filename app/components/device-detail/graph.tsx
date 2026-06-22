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
	type ChartData,
	type ChartOptions,
} from 'chart.js'
import 'chartjs-adapter-date-fns'
// import { de, enGB } from "date-fns/locale";
import { ChartLine, Download, RefreshCcw, X } from 'lucide-react'
import {
	useCallback,
	useMemo,
	useRef,
	useState,
	useEffect,
	useContext,
	type RefObject,
} from 'react'
import { Scatter } from 'react-chartjs-2'
import { isBrowser, isTablet } from 'react-device-detect'
import Draggable, {
	type DraggableData,
	type DraggableEvent,
} from 'react-draggable'
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
import { Toggle } from '../ui/toggle'
import { buildChartCsv } from './graph-csv'
import {
	buildChartData,
	type GraphPoint,
	type GraphSensor,
} from './graph-chart-data'
import { useGraphOptions } from './use-graph-options'
import { useResolvedTheme } from '~/hooks/use-resolved-theme'
import { useTranslation } from 'react-i18next'

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

type GraphChartData = ChartData<'scatter', GraphPoint[]>

type GraphWithZoomProps = {
	chartData: GraphChartData
	options: ChartOptions<'scatter'>
	chartRef: RefObject<ChartJS<'scatter', GraphPoint[]> | null>
}

// ClientOnly component to handle the plugin that needs window
const GraphWithZoom = ({
	chartData,
	options,
	chartRef,
}: GraphWithZoomProps) => {
	useEffect(() => {
		void import('chartjs-plugin-zoom').then(({ default: zoomPlugin }) => {
			ChartJS.register(zoomPlugin)
		})
	}, [])

	return <Scatter data={chartData} options={options} ref={chartRef}></Scatter>
}

interface GraphProps {
	aggregation: string
	sensors: GraphSensor[]
	startDate?: string
	endDate?: string
}

type DatasetColorOverrides = Record<number, string>

function applyDatasetColorOverrides(
	chartData: GraphChartData,
	colorOverrides: DatasetColorOverrides,
) {
	return {
		...chartData,
		datasets: chartData.datasets.map((dataset, index) => {
			const color = colorOverrides[index]

			if (!color) return dataset

			return {
				...dataset,
				borderColor: color,
				backgroundColor: color,
			}
		}),
	}
}

export default function Graph({
	aggregation,
	sensors,
	startDate,
	endDate,
}: GraphProps) {
	const { setHoveredPoint } = useContext(HoveredPointContext)
	const navigation = useNavigation()
	const { t, i18n } = useTranslation('graph')
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
	const [showLines, setShowLines] = useState(false)
	const isAggregated = aggregation !== 'raw'

	const nodeRef = useRef<HTMLDivElement>(null)
	const chartRef = useRef<ChartJS<'scatter', GraphPoint[]> | null>(null)

	const dateTimeFormatter = useMemo(() => {
		return new Intl.DateTimeFormat(i18n.language, {
			dateStyle: 'medium',
			timeStyle: 'medium',
		})
	}, [i18n.language])

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

	const theme = useResolvedTheme()
	const [datasetColorOverrides, setDatasetColorOverrides] =
		useState<DatasetColorOverrides>({})

	useEffect(() => {
		setDatasetColorOverrides({})
	}, [sensors, isAggregated])

	const chartData = useMemo(
		() =>
			applyDatasetColorOverrides(
				buildChartData({ sensors, isAggregated, showLines }),
				datasetColorOverrides,
			),
		[sensors, isAggregated, showLines, datasetColorOverrides],
	)

	const handleDatasetColorClick = useCallback(
		(index: number, color: string) => {
			setColorPickerState((currentState) => ({
				open: !currentState.open,
				index,
				color,
			}))
		},
		[],
	)

	const options = useGraphOptions({
		chartData,
		currentZoom,
		dateTimeFormatter,
		endDate,
		onDatasetColorClick: handleDatasetColorClick,
		sensors,
		setCurrentZoom,
		setHoveredPoint,
		startDate,
		theme,
	})

	function handleColorChange(newColor: string) {
		setDatasetColorOverrides((currentOverrides) => ({
			...currentOverrides,
			[colorPickerState.index]: newColor,
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
		const csvContent = buildChartCsv(chartData, sensors)
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
		const link = document.createElement('a')
		const url = URL.createObjectURL(blob)

		link.href = url
		link.download = 'chart_data.csv'

		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		URL.revokeObjectURL(url)
	}

	function handleResetZoomClick() {
		if (chartRef.current) {
			chartRef.current.resetZoom() // Use the resetZoom function from the zoom plugin
			setCurrentZoom(null) // Reset the zoom state
		}
	}

	function handleDrag(_event: DraggableEvent, data: DraggableData) {
		setOffsetPositionX(data.x)
		setOffsetPositionY(data.y)
	}

	return (
		<>
			<Draggable
				nodeRef={nodeRef as RefObject<HTMLDivElement>}
				bounds="#osem"
				handle="#graphTop"
				defaultPosition={{ x: offsetPositionX, y: offsetPositionY }}
				onDrag={handleDrag}
				disabled={!isBrowser && !isTablet}
			>
				<div
					ref={nodeRef}
					className="absolute top-14 right-4 bottom-6 left-4 z-40 flex flex-col gap-2 rounded-xl bg-white px-4 pt-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 md:top-auto md:right-4 md:bottom-7.5 md:left-auto md:h-[35%] md:max-h-[35%] md:w-[60vw] dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95 dark:ring-white dark:backdrop-blur-xs"
				>
					{navigation.state === 'loading' && (
						<div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-100/30 backdrop-blur-[1.5px]">
							<Spinner />
						</div>
					)}
					<div
						className="flex cursor-move flex-wrap items-center justify-between gap-2 px-2 pt-2"
						id="graphTop"
					>
						<div className="flex grow flex-wrap items-center gap-2">
							<DateRangeFilter />
							<AggregationFilter />
						</div>
						<div className="ml-auto flex items-center justify-end gap-4">
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
												<p>{t('reset_zoom')}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								)}
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Toggle
											pressed={showLines}
											onPressedChange={setShowLines}
											size="sm"
											aria-label={t('connect_points')}
											className="h-6 w-6 p-1"
										>
											<ChartLine className="h-5 w-5" />
										</Toggle>
									</TooltipTrigger>
									<TooltipContent>
										<p>{t('connect_points')}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
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
									const nextSearchParams = new URLSearchParams(searchParams)
									nextSearchParams.delete('date_to')
									nextSearchParams.delete('date_from')
									nextSearchParams.delete('aggregation')
									setSearchParams(nextSearchParams)
									void navigate({
										pathname: `/explore/${sensors[0].deviceId}`,
										search: nextSearchParams.toString(),
									})
								}}
							/>
						</div>
					</div>
					<div className="flex min-h-0 w-full flex-1 items-center justify-center">
						{(sensors[0].data.length === 0 && sensors[1] === undefined) ||
						(sensors[0].data.length === 0 && sensors[1].data.length === 0) ? (
							<div>{t('no_data_in_range')}</div>
						) : (
							<ClientOnly fallback={<Spinner />}>
								{() => (
									<GraphWithZoom
										chartData={chartData}
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
