import { useMemo } from 'react'

export default function SpaceBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 1,
        twinkleDelay: Math.random() * 5,
        driftDuration: 10 + Math.random() * 12,
        driftX: `${(Math.random() - 0.5) * 10}px`,
        driftY: `${(Math.random() - 0.5) * 10}px`,
      })),
    [],
  )

  const shootingStars = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        id: i,
        top: Math.random() * 45,
        left: Math.random() * 110,
        delay: Math.random() * 18,
        duration: 1 + Math.random() * 1.2,
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