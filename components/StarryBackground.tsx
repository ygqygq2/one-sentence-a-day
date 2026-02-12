"use client"

import { useEffect, useRef } from "react"
import { useColorModeValue } from "./ui/color-mode"

interface Star {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  twinkleSpeed: number
  twinklePhase: number
  fadeIn: boolean
  targetOpacity: number
}

interface Meteor {
  x: number
  y: number
  length: number
  speed: number
  angle: number
  opacity: number
  trail: { x: number; y: number; opacity: number }[]
}

export default function StarryBackground() {
  const shouldShow = useColorModeValue(false, true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const meteorsRef = useRef<Meteor[]>([])
  const animationFrameRef = useRef(0)
  const lastMeteorTimeRef = useRef<number>(0)
  const meteorTimersRef = useRef<number[]>([])

  useEffect(() => {
    if (!shouldShow) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Initialize stars
    const initStars = () => {
      starsRef.current = []
      const starCount = Math.floor((canvas.width * canvas.height) / 8000) // Density of stars
      for (let i = 0; i < starCount; i++) {
        const opacity = Math.random() * 0.5 + 0.5
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.05 + 0.02,
          opacity: opacity,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
          fadeIn: Math.random() > 0.5,
          targetOpacity: opacity,
        })
      }
    }

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Create a new meteor
    const createMeteor = () => {
      const startX = Math.random() * canvas.width * 0.5 + canvas.width * 0.25
      const startY = Math.random() * canvas.height * 0.3
      
      meteorsRef.current.push({
        x: startX,
        y: startY,
        length: Math.random() * 80 + 60, // Long tail
        speed: Math.random() * 3 + 4,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.4, // Roughly 45 degrees with some variation
        opacity: 1,
        trail: [],
      })
    }

    // Animation loop
    const animate = (timestamp: number) => {
      // Redraw background (fillRect overwrites all pixels, no need for clearRect)
      ctx.fillStyle = "rgb(17, 24, 39)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw and update stars
      starsRef.current.forEach((star) => {
        // Twinkling effect
        star.twinklePhase += star.twinkleSpeed
        const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7
        
        // Fade in/out effect - some stars appear and disappear
        if (star.fadeIn) {
          star.opacity += 0.002
          if (star.opacity >= star.targetOpacity) {
            star.fadeIn = false
            // Randomly decide to start fading out or keep twinkling
            if (Math.random() > 0.7) {
              star.targetOpacity = 0
            }
          }
        } else {
          star.opacity -= 0.001
          if (star.opacity <= 0) {
            // Reset star - it will reappear
            star.opacity = 0
            star.fadeIn = true
            star.targetOpacity = Math.random() * 0.5 + 0.5
            star.x = Math.random() * canvas.width
            star.y = Math.random() * canvas.height
          }
        }
        
        const currentOpacity = Math.max(0, star.opacity * twinkle)

        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()

        // Add glow for larger stars
        if (star.size > 1.5 && currentOpacity > 0.3) {
          ctx.shadowBlur = 3
          ctx.shadowColor = `rgba(255, 255, 255, ${currentOpacity * 0.5})`
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })

      // Create meteors randomly - increased frequency and multiple meteors
      if (timestamp - lastMeteorTimeRef.current > 1000 + Math.random() * 2000) {
        // Create 2-3 meteors at once with slight variation in timing
        const meteorCount = Math.floor(Math.random() * 2) + 2 // 2-3 meteors
        for (let i = 0; i < meteorCount; i++) {
          const timerId = window.setTimeout(() => createMeteor(), i * (100 + Math.random() * 200))
          meteorTimersRef.current.push(timerId)
        }
        lastMeteorTimeRef.current = timestamp
      }

      // Draw and update meteors
      meteorsRef.current = meteorsRef.current.filter((meteor) => {
        // Update position
        meteor.x += Math.cos(meteor.angle) * meteor.speed
        meteor.y += Math.sin(meteor.angle) * meteor.speed

        // Add current position to trail
        meteor.trail.push({ 
          x: meteor.x, 
          y: meteor.y, 
          opacity: meteor.opacity 
        })

        // Keep trail length longer for continuous effect
        if (meteor.trail.length > 50) {
          meteor.trail.shift()
        }

        // Fade out slower for longer visibility
        meteor.opacity -= 0.005

        // Draw meteor trail as a continuous smooth gradient path
        if (meteor.trail.length > 2) {
          ctx.save()
          ctx.globalCompositeOperation = 'lighter'
          
          // Create a smooth continuous path using quadratic curves
          ctx.beginPath()
          
          // Start at the first trail point
          const firstPoint = meteor.trail[0]
          ctx.moveTo(firstPoint.x, firstPoint.y)
          
          // Draw smooth curve through all trail points
          for (let i = 1; i < meteor.trail.length - 1; i++) {
            const currentPoint = meteor.trail[i]
            const nextPoint = meteor.trail[i + 1]
            
            // Use quadratic curve to smooth between points
            const cpX = (currentPoint.x + nextPoint.x) / 2
            const cpY = (currentPoint.y + nextPoint.y) / 2
            ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, cpX, cpY)
          }
          
          // Complete the path to the last point
          const lastPoint = meteor.trail[meteor.trail.length - 1]
          ctx.lineTo(lastPoint.x, lastPoint.y)
          
          // Create gradient along the trail for smooth fade effect
          const gradient = ctx.createLinearGradient(
            firstPoint.x, firstPoint.y,
            lastPoint.x, lastPoint.y
          )
          
          // Gradient from tail (transparent) to head (bright)
          gradient.addColorStop(0, `rgba(120, 160, 255, 0)`)
          gradient.addColorStop(0.3, `rgba(140, 180, 255, ${meteor.opacity * 0.3})`)
          gradient.addColorStop(0.6, `rgba(180, 210, 255, ${meteor.opacity * 0.6})`)
          gradient.addColorStop(1, `rgba(220, 240, 255, ${meteor.opacity * 0.9})`)
          
          // Draw the trail with varying width for taper effect
          ctx.strokeStyle = gradient
          ctx.lineWidth = 3
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.shadowBlur = 8
          ctx.shadowColor = `rgba(180, 210, 255, ${meteor.opacity * 0.6})`
          ctx.stroke()
          
          // Draw a second, thinner bright core line for extra luminosity
          ctx.strokeStyle = `rgba(255, 255, 255, ${meteor.opacity * 0.8})`
          ctx.lineWidth = 1.5
          ctx.shadowBlur = 4
          ctx.shadowColor = `rgba(255, 255, 255, ${meteor.opacity * 0.5})`
          ctx.stroke()
          
          ctx.restore()
        }

        // Draw meteor head with enhanced size and glow
        const headGradient = ctx.createRadialGradient(
          meteor.x, meteor.y, 0,
          meteor.x, meteor.y, 8
        )
        headGradient.addColorStop(0, `rgba(255, 255, 255, ${meteor.opacity})`)
        headGradient.addColorStop(0.3, `rgba(240, 245, 255, ${meteor.opacity * 0.9})`)
        headGradient.addColorStop(0.6, `rgba(200, 220, 255, ${meteor.opacity * 0.6})`)
        headGradient.addColorStop(1, `rgba(150, 180, 255, ${meteor.opacity * 0.1})`)

        // Apply glow effect to the head
        ctx.shadowBlur = 20
        ctx.shadowColor = `rgba(220, 235, 255, ${meteor.opacity * 0.8})`
        ctx.fillStyle = headGradient
        ctx.beginPath()
        ctx.arc(meteor.x, meteor.y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Keep meteor if still visible - extended bounds to pass through entire page
        return (
          meteor.opacity > 0 &&
          meteor.x > -200 &&
          meteor.x < canvas.width + 200 &&
          meteor.y > -200 &&
          meteor.y < canvas.height + 200
        )
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      // Clear all pending meteor timers
      meteorTimersRef.current.forEach(timerId => clearTimeout(timerId))
      meteorTimersRef.current = []
    }
  }, [shouldShow])

  if (!shouldShow) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        background: "rgb(17, 24, 39)",
      }}
    />
  )
}
