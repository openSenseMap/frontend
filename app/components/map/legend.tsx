import { useRef, useState } from 'react'
import { isTablet, isBrowser } from 'react-device-detect'
import Draggable, { type DraggableData } from 'react-draggable'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'

export type LegendValue = {
	value: number
	color: string
	position: string
}

interface LegendProps {
	title: string
	values: LegendValue[] | null
}

export default function Legend({ title, values }: LegendProps) {
	const [isOpen, setIsOpen] = useState(true)

	const nodeRef = useRef<HTMLDivElement>(null)
	// state variables
	const [offsetPositionX, setOffsetPositionX] = useState(0)
	const [offsetPositionY, setOffsetPositionY] = useState(0)

	function handleDrag(_e: any, data: DraggableData) {
		setOffsetPositionX(data.x)
		setOffsetPositionY(data.y)
	}

	if (title === 'all' || title === '') {
		return null
	}

	return (
		<Draggable
			nodeRef={nodeRef as React.RefObject<HTMLDivElement>}
			defaultPosition={{ x: offsetPositionX, y: offsetPositionY }}
			onDrag={handleDrag}
			bounds="#osem"
			handle="#legendHandle"
			disabled={!isBrowser && !isTablet}
		>
			<Accordion
				type="single"
				collapsible
				ref={nodeRef}
				defaultValue="item-1"
				onValueChange={() => setIsOpen(!isOpen)}
				className="absolute right-4 bottom-28 z-10 w-[calc(100vw-2rem)] max-w-sm rounded-lg bg-white shadow-sm sm:bottom-[15%] sm:w-72 lg:w-1/4 xl:w-1/5"
			>
				<AccordionItem value="item-1">
					<AccordionTrigger
						id="legendHandle"
						className="min-w-0 p-3 text-left font-bold wrap-break-word capitalize sm:p-4"
					>
						{isOpen ? title : 'Legende'}
					</AccordionTrigger>
					<AccordionContent>
						<div className="mx-2 px-2 sm:mx-5 sm:px-4">
							<div className="relative h-14.5">
								{values?.map((v, i) => {
									return (
										<div
											key={i}
											className={`absolute top-0 ml-4 flex h-12 flex-col items-center`}
											style={{
												right: `min(${v.position}, calc(100% - 2rem))`,
											}}
										>
											<svg
												viewBox="0 0 32 34"
												className={`w-8 flex-none drop-shadow-sm`}
												fill={v.color}
											>
												<path d="M1 4a4 4 0 0 1 4-4h22a4 4 0 0 1 4 4v19.6a4 4 0 0 1-2.118 3.53L16 34 3.118 27.13A4 4 0 0 1 1 23.6V4Z" />
												<path
													fill="none"
													stroke="#000"
													strokeOpacity=".05"
													d="M5 .5h22A3.5 3.5 0 0 1 30.5 4v19.6a3.5 3.5 0 0 1-1.853 3.088L16 33.433 3.353 26.688A3.5 3.5 0 0 1 1.5 23.6V4A3.5 3.5 0 0 1 5 .5Z"
												/>
											</svg>
											<div className="mt-2 h-2 w-0.5 bg-gray-700 dark:bg-white/30"></div>
											<div className="absolute top-0 left-0 flex h-8 w-full items-center justify-center font-mono text-[0.6875rem] font-semibold">
												{v.value}
											</div>
										</div>
									)
								})}
							</div>
						</div>
						<div className="flex flex-wrap px-4">
							{values && (
								<div
									className="h-5 w-full"
									style={{
										background: `-webkit-linear-gradient(45deg, ${values
											.map((v) => v.color)
											.join(', ')} )`,
									}}
								></div>
							)}
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</Draggable>
	)
}
