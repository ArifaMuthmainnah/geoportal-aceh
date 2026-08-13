import { useEffect, useRef, useState } from 'react'

function AnimatedCounter({ value, suffix = '' }) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current

    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      {
        threshold: 0.4,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    const duration = 1500
    const startTime = performance.now()

    const animate = (currentTime) => {
      const progress = Math.min(
        (currentTime - startTime) / duration,
        1
      )

      // easeOutCubic
      const easedProgress =
        1 - Math.pow(1 - progress, 3)

      const currentValue = Math.floor(
        easedProgress * value
      )

      setCount(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(value)
      }
    }

    requestAnimationFrame(animate)
  }, [hasStarted, value])

  return (
    <span ref={elementRef}>
      {count}
      {suffix}
    </span>
  )
}

export default AnimatedCounter