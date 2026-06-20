import { useMemo } from 'react'
import { type ChartData, type ChartOptions, type TooltipItem } from 'chart.js'
import { type ResolvedTheme } from '~/lib/theme'
import { datesHave48HourRange } from '~/lib/utils'
import { type GraphPoint, type GraphSensor } from './graph-chart-data'

type CurrentZoom = {
	xMin: number
	xMax: number
} | null

type UseGraphOptionsArgs = {
	chartData: ChartData<'scatter', GraphPoint[]>
	currentZoom: CurrentZoom
	dateTimeFormatter: Intl.DateTimeFormat
	endDate?: string
	onDatasetColorClick: (index: number, color: string) => void
	sensors: GraphSensor[]
	setCurrentZoom: (zoom: Exclude<CurrentZoom, null>) => void
	setHoveredPoint: (point: number | null) => void
	startDate?: string
	theme: ResolvedTheme
}

export function useGraphOptions({
	chartData,
	currentZoom,
	dateTimeFormatter,
	endDate,
	onDatasetColorClick,
	sensors,
	setCurrentZoom,
	setHoveredPoint,
	startDate,
	theme,
}: UseGraphOptionsArgs): ChartOptions<'scatter'> {
	return useMemo(() => {
		const gridColor =
			theme === 'dark' ? 'rgba(255, 255, 255)' : 'rgba(0, 0, 0, 0.1)'

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
			onHover: (_event, elements) => {
				const activeElement = elements[0]

				if (!activeElement) {
					setHoveredPoint(null)
					return
				}

				const point =
					chartData.datasets[activeElement.datasetIndex]?.data[
						activeElement.index
					]

				setHoveredPoint(point?.locationId ?? null)
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
						color: gridColor,
						borderColor: gridColor,
					},
				},
				y: {
					title: {
						display: true,
						text: sensors[0].title + ' in ' + sensors[0].unit,
					},
					display: true,
					position: 'left',
					grid: {
						color: gridColor,
						borderColor: gridColor,
					},
				},
				y1: {
					title: {
						display: true,
						text: sensors[1] ? sensors[1].title + ' in ' + sensors[1].unit : '',
					},
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
						title: (tooltipItems: TooltipItem<'scatter'>[]) => {
							const firstItem = tooltipItems[0]

							if (!firstItem) return ''

							const timestamp = (firstItem.raw as GraphPoint).x

							if (!timestamp) return ''

							return dateTimeFormatter.format(new Date(timestamp))
						},

						label: (context: TooltipItem<'scatter'>) => {
							const point = context.raw as GraphPoint

							return `${context.dataset.label}: ${point.y}`
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

							setCurrentZoom({ xMin, xMax })
						},
					},
				},
				legend: {
					display: true,
					position: 'bottom',
					onHover: (_event, legendItem, legend) => {
						const canvas = legend.chart.canvas

						if (legendItem.fillStyle) {
							canvas.style.cursor = 'pointer'
							canvas.title = 'Click to change color'
						}
					},
					onLeave: (_event, _legendItem, legend) => {
						const canvas = legend.chart.canvas
						canvas.style.cursor = 'default'
						canvas.title = ''
					},

					onClick: (_event, legendItem, _legend) => {
						const index = legendItem.datasetIndex ?? 0
						onDatasetColorClick(
							index,
							chartData.datasets[index].borderColor as string,
						)
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
		chartData.datasets,
		setHoveredPoint,
		dateTimeFormatter,
		setCurrentZoom,
		onDatasetColorClick,
	])
}
