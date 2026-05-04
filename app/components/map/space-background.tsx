import { useLayoutEffect, useMemo, useState } from 'react'

const SPACE_AREA_PERCENT = 100

const STAR_COUNT = 55

const STAR = {
	opacity: 0.12,

	size: {
		min: 0.6,
		max: 2,
	},

	twinkle: {
		delayMax: 5,
		durationMin: 4,
		durationMax: 8,
	},

	drift: {
		distancePx: 6,
		durationMin: 18,
		durationMax: 36,
	},
} as const

const SHOOTING_STAR = {
	count: 1,

	position: {
		topMaxPercent: 35,
		leftMinPercent: 65,
		leftMaxPercent: 100,
	},

	delay: {
		min: 35,
		max: 90,
	},

	duration: {
		min: 2.8,
		max: 4.3,
	},
} as const

function randomBetween(min: number, max: number) {
	return min + Math.random() * (max - min)
}

function randomSigned(distance: number) {
	return (Math.random() - 0.5) * distance
}

export default function SpaceBackground() {
	const [randomValues, setRandomValues] = useState(Array(12).fill(0))

	const stars = useMemo(
		() =>
			Array.from({ length: STAR_COUNT }, (_, i) => ({
				id: i,
				top: randomValues[0],
				left: randomValues[1],
				size: randomValues[2],
				twinkleDelay: randomValues[3],
				twinkleDuration: randomValues[4],
				driftDuration: randomValues[5],
				driftX: `${randomValues[6]}px`,
				driftY: `${randomValues[7]}px`,
			})),
		[randomValues],
	)

	const shootingStars = useMemo(
		() =>
			Array.from({ length: SHOOTING_STAR.count }, (_, i) => ({
				id: i,
				top: randomValues[8],
				left: randomValues[9],
				delay: randomValues[10],
				duration: randomValues[11],
			})),
		[randomValues],
	)

	/** Using a layout effect to generate the random values prevents hydration issues */
	useLayoutEffect(() => {
		setRandomValues([
			randomBetween(0, SPACE_AREA_PERCENT),
			randomBetween(0, SPACE_AREA_PERCENT),
			randomBetween(STAR.size.min, STAR.size.max),
			randomBetween(0, STAR.twinkle.delayMax),
			randomBetween(STAR.twinkle.durationMin, STAR.twinkle.durationMax),
			randomBetween(STAR.drift.durationMin, STAR.drift.durationMax),
			randomSigned(STAR.drift.distancePx),
			randomSigned(STAR.drift.distancePx),
			randomBetween(0, SHOOTING_STAR.position.topMaxPercent),
			randomBetween(
				SHOOTING_STAR.position.leftMinPercent,
				SHOOTING_STAR.position.leftMaxPercent,
			),
			randomBetween(SHOOTING_STAR.delay.min, SHOOTING_STAR.delay.max),
			randomBetween(SHOOTING_STAR.duration.min, SHOOTING_STAR.duration.max),
		])
	}, [])

	return (
		<div className="space-bg" aria-hidden="true">
			{stars.map((star) => (
				<span
					key={star.id}
					className="space-star"
					style={
						{
							top: `${star.top}%`,
							left: `${star.left}%`,
							width: `${star.size}px`,
							height: `${star.size}px`,
							animationDelay: `${star.twinkleDelay}s`,
							animationDuration: `${star.twinkleDuration}s`,
							'--drift-x': star.driftX,
							'--drift-y': star.driftY,
							'--drift-duration': `${star.driftDuration}s`,
							'--star-opacity': STAR.opacity,
						} as React.CSSProperties
					}
				/>
			))}

			{shootingStars.map((star) => (
				<span
					key={star.id}
					className="space-shooting-star"
					style={{
						top: `${star.top}%`,
						left: `${star.left}%`,
						animationDelay: `${star.delay}s`,
						animationDuration: `${star.duration}s`,
					}}
				/>
			))}
		</div>
	)
}
