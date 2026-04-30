import { useMemo } from 'react'

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
	const stars = useMemo(
		() =>
			Array.from({ length: STAR_COUNT }, (_, i) => ({
				id: i,
				top: randomBetween(0, SPACE_AREA_PERCENT),
				left: randomBetween(0, SPACE_AREA_PERCENT),
				size: randomBetween(STAR.size.min, STAR.size.max),
				twinkleDelay: randomBetween(0, STAR.twinkle.delayMax),
				twinkleDuration: randomBetween(
					STAR.twinkle.durationMin,
					STAR.twinkle.durationMax,
				),
				driftDuration: randomBetween(
					STAR.drift.durationMin,
					STAR.drift.durationMax,
				),
				driftX: `${randomSigned(STAR.drift.distancePx)}px`,
				driftY: `${randomSigned(STAR.drift.distancePx)}px`,
			})),
		[],
	)

	const shootingStars = useMemo(
		() =>
			Array.from({ length: SHOOTING_STAR.count }, (_, i) => ({
				id: i,
				top: randomBetween(0, SHOOTING_STAR.position.topMaxPercent),
				left: randomBetween(
					SHOOTING_STAR.position.leftMinPercent,
					SHOOTING_STAR.position.leftMaxPercent,
				),
				delay: randomBetween(
					SHOOTING_STAR.delay.min,
					SHOOTING_STAR.delay.max,
				),
				duration: randomBetween(
					SHOOTING_STAR.duration.min,
					SHOOTING_STAR.duration.max,
				),
			})),
		[],
	)

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