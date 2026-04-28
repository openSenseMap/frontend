import { useMemo } from 'react'

const STAR_COUNT = 100
const STAR_SPACING_FACTOR = 100
const STAR_TWINKLE_DELAY_FACTOR = 1000
const STAR_OPACITY = 0.15
const SHOOTING_STAR_COUNT = 3
const SHOOTING_STAR_DURATION_FACTOR = 1.5
const SHOOTING_STAR_DELAY_FACTOR = 100
const SHOOTING_STAR_SPACING_FACTOR = 100

export default function SpaceBackground() {
	const stars = useMemo(
		() =>
			Array.from({ length: STAR_COUNT }, (_, i) => ({
				id: i,
				top: Math.random() * STAR_SPACING_FACTOR,
				left: Math.random() * STAR_SPACING_FACTOR,
				size: Math.random() * 2 + 1,
				twinkleDelay: Math.random() * STAR_TWINKLE_DELAY_FACTOR,
				driftDuration: 10 + Math.random() * 12,
				driftX: `${(Math.random() - 0.5) * 10}px`,
				driftY: `${(Math.random() - 0.5) * 10}px`,
			})),
		[],
	)

	const shootingStars = useMemo(
		() =>
			Array.from({ length: SHOOTING_STAR_COUNT }, (_, i) => ({
				id: i,
				top: Math.random() * SHOOTING_STAR_SPACING_FACTOR,
				left: Math.random() * SHOOTING_STAR_SPACING_FACTOR,
				delay: Math.random() * SHOOTING_STAR_DELAY_FACTOR,
				duration: 1 + Math.random() * SHOOTING_STAR_DURATION_FACTOR,
			})),
		[],
	)

	return (
		<div className="space-bg" aria-hidden="true">
			{stars.map((star) => (
				<span
					key={star.id}
					className="space-star"
					style={{
						top: `${star.top}%`,
						left: `${star.left}%`,
						width: `${star.size}px`,
						height: `${star.size}px`,
						animationDelay: `${star.twinkleDelay}s`,
						['--drift-x' as any]: star.driftX,
						['--drift-y' as any]: star.driftY,
						['--drift-duration' as any]: `${star.driftDuration}s`,
						['--star-opacity' as any]: STAR_OPACITY,
					}}
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
