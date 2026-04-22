import { useMemo } from 'react'

export default function SpaceBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        size: Math.random() * 2 + 1,
      })),
    [],
  )

  const meteors = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        top: Math.random() * 40,
        left: Math.random() * 140,
        delay: Math.random() * 30,
        duration: 2 + Math.random() * 2,
      })),
    [],
  )

  return (
    <div className="space-bg">
      {stars.map((star) => (
        <span
          key={star.id}
          className="space-star"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      {meteors.map((meteor) => (
        <span
          key={meteor.id}
          className="space-meteor"
          style={{
            top: `${meteor.top}%`,
            left: `${meteor.left}%`,
            animationDelay: `${meteor.delay}s`,
            animationDuration: `${meteor.duration}s`,
          }}
        />
      ))}
    </div>
  )
}