import { ChevronUp, Minus, Share2, X } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { isTablet, isBrowser } from 'react-device-detect'
import Draggable, { type DraggableData } from 'react-draggable'
import {
	useLoaderData,
	useNavigate,
	useNavigation,
	useSearchParams,
} from 'react-router'
import DeviceMetadataInfo from './device-metadata-info'
import DeviceImage from './device-image'
import DeviceOptions from './device-options'
import DeviceTags from './device-tags'
import SensorCards from './sensor-cards'
import Spinner from '../spinner'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '../ui/accordion'
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '../ui/alert-dialog'
import { Separator } from '../ui/separator'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../ui/tooltip'
import EntryLogs from './entry-logs'
import ShareLink from './share-link'
import { type loader } from '~/routes/explore.$deviceId'
import { type SensorWithLatestMeasurement } from '~/schema'

export interface MeasurementProps {
	sensorId: string
	time: Date
	value: string
	min_value: string
	max_value: string
}

export default function DeviceDetailBox() {
	const navigation = useNavigation()
	const navigate = useNavigate()
	const data = useLoaderData<typeof loader>()
	const nodeRef = useRef(null)
	const [searchParams] = useSearchParams()

	// state variables
	const [open, setOpen] = useState(true)
	const [offsetPositionX, setOffsetPositionX] = useState(0)
	const [offsetPositionY, setOffsetPositionY] = useState(0)
	const [refreshOn] = useState(false)
	const [refreshSecond, setRefreshSecond] = useState(59)
	const [sensors, setSensors] = useState<SensorWithLatestMeasurement[]>()

	useEffect(() => {
		const sortedSensors = [...data.sensors].sort(
			(a, b) => (a.id as unknown as number) - (b.id as unknown as number),
		)
		setSensors(sortedSensors)
	}, [data.sensors])

	useEffect(() => {
		let interval: any = null
		if (refreshOn) {
			if (refreshSecond == 0) {
				setRefreshSecond(59)
			}
			interval = setInterval(() => {
				setRefreshSecond((refreshSecond) => refreshSecond - 1)
			}, 1000)
		} else if (!refreshOn) {
			clearInterval(interval)
		}
		return () => clearInterval(interval)
	}, [refreshOn, refreshSecond])

	function handleDrag(_e: any, data: DraggableData) {
		setOffsetPositionX(data.x)
		setOffsetPositionY(data.y)
	}

	const addLineBreaks = (text: string) =>
		text.split('\\n').map((text, index) => (
			<Fragment key={`${text}-${index}`}>
				{text}
				<br />
			</Fragment>
		))

	if (!data.device) return null

	return (
		<>
			{open && (
				<Draggable
					nodeRef={nodeRef}
					defaultPosition={{ x: offsetPositionX, y: offsetPositionY }}
					onDrag={handleDrag}
					bounds="#osem"
					handle="#deviceDetailBoxTop"
					disabled={!isBrowser && !isTablet}
				>
					<div
						ref={nodeRef}
						className="absolute bottom-6 left-4 right-4 top-14 z-40 flex flex-row px-4 py-2 md:bottom-[30px] md:left-[10px] md:top-auto md:max-h-[calc(100vh-8rem)] md:w-1/3 md:p-0"
					>
						<div
							id="deviceDetailBox"
							className={
								'shadow-zinc-800/5 ring-zinc-900/5 relative float-left flex h-full max-h-[calc(100vh-4rem)] w-auto flex-col gap-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg ring-1 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95 dark:ring-white dark:backdrop-blur-sm md:max-h-[calc(100vh-8rem)]'
							}
						>
							{navigation.state === 'loading' && (
								<div className="bg-white/30 dark:bg-zinc-800/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
									<Spinner />
								</div>
							)}
							{/* this is the header */}
							<div
								id="deviceDetailBoxTop"
								className="flex w-full cursor-move items-center gap-3 py-2"
							>
								<div
									className={
										data.device.status === 'active'
											? 'h-4 w-4 rounded-full bg-light-green'
											: 'h-4 w-4 rounded-full bg-red-500'
									}
								></div>
								<div className="flex flex-1 text-center text-xl text-zinc-600 dark:dark:text-zinc-100">
									{data.device.name}
								</div>
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Share2 className="cursor-pointer" />
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Share this link</AlertDialogTitle>
											<ShareLink />
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Close</AlertDialogCancel>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
								<DeviceOptions
									id={data.device.id}
									name={data.device.name}
									link={data.device.link}
								/>
								<Minus
									className="cursor-pointer"
									onClick={() => setOpen(false)}
								/>
								<X
									className="cursor-pointer"
									onClick={() => {
										void navigate({
											pathname: '/explore',
											search: searchParams.toString(),
										})
									}}
								/>
							</div>
							<div className="no-scrollbar relative flex-1 overflow-y-scroll">
								{/* this is the metadata */}
								<div className="space-y-4 sm:flex sm:space-x-4 sm:space-y-0">
									<DeviceImage image={data.device.image} />
									<DeviceMetadataInfo {...data.device} />
								</div>
								{/* here are the tags */}
								{data.device.tags && <DeviceTags tags={data.device.tags} />}
								<Separator className="my-4"></Separator>
								{/* log entry component */}
								{data.device.logEntries.length > 0 && (
									<>
										<EntryLogs entryLogs={data.device.logEntries} />
										<Separator className="my-4" />
									</>
								)}
								{/* description component */}
								{data.device.description && (
									<Accordion
										type="single"
										collapsible
										className="w-full"
										defaultValue={'item-1'}
									>
										<AccordionItem value="item-1">
											<AccordionTrigger className="font-bold dark:dark:text-zinc-100">
												Description
											</AccordionTrigger>
											<AccordionContent>
												{addLineBreaks(data.device.description)}
											</AccordionContent>
										</AccordionItem>
									</Accordion>
								)}
								{/* sensors component */}
								<Accordion
									type="single"
									collapsible
									className="w-full"
									defaultValue={'item-1'}
								>
									<AccordionItem value="item-1">
										<AccordionTrigger className="font-bold dark:dark:text-zinc-100">
											Sensors
										</AccordionTrigger>
										<AccordionContent>
											{sensors && <SensorCards sensors={sensors} />}
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							</div>
						</div>
					</div>
				</Draggable>
			)}
			{!open && (
				<div
					onClick={() => {
						setOpen(true)
					}}
					className="absolute bottom-[10px] left-4 flex cursor-pointer rounded-xl border border-gray-100 bg-white shadow-lg transition-colors duration-300 ease-in-out hover:brightness-90 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-90 sm:bottom-[30px] sm:left-[10px]"
				>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="px-4 py-2 ">
									<ChevronUp />
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>Open device details</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			)}
		</>
	)
}
