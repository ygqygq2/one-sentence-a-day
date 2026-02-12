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
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastMeteorTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!shouldShow) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Initialize stars
    const initStars = () => {
      starsRef.current = []
      const starCount = Math.floor((canvas.width * canvas.height) / 8000) // Density of stars
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.05 + 0.02,
          opacity: Math.random() * 0.5 + 0.5,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
        })
      }
    }

    initStars()

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
      ctx.fillStyle = "rgba(17, 24, 39, 0.1)" // Slight fade effect for trails
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw and update stars
      starsRef.current.forEach((star) => {
        // Twinkling effect
        star.twinklePhase += star.twinkleSpeed
        const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7
        const currentOpacity = star.opacity * twinkle

        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()

        // Add glow for larger stars
        if (star.size > 1.5) {
          ctx.shadowBlur = 3
          ctx.shadowColor = `rgba(255, 255, 255, ${currentOpacity * 0.5})`
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })

      // Create meteors randomly
      if (timestamp - lastMeteorTimeRef.current > 2000 + Math.random() * 3000) {
        createMeteor()
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

        // Keep trail length
        if (meteor.trail.length > 30) {
          meteor.trail.shift()
        }

        // Fade out
        meteor.opacity -= 0.008

        // Draw meteor trail
        if (meteor.trail.length > 1) {
          for (let i = 0; i < meteor.trail.length - 1; i++) {
            const point = meteor.trail[i]
            const nextPoint = meteor.trail[i + 1]
            const trailProgress = i / meteor.trail.length
            const opacity = point.opacity * (1 - trailProgress) * 0.8

            // Create gradient for meteor tail
            const gradient = ctx.createLinearGradient(
              point.x, point.y,
              nextPoint.x, nextPoint.y
            )
            gradient.addColorStop(0, `rgba(200, 220, 255, ${opacity * 0.3})`)
            gradient.addColorStop(0.5, `rgba(150, 180, 255, ${opacity * 0.6})`)
            gradient.addColorStop(1, `rgba(100, 150, 255, ${opacity})`)

            ctx.strokeStyle = gradient
            ctx.lineWidth = 2 + (1 - trailProgress) * 2
            ctx.beginPath()
            ctx.moveTo(point.x, point.y)
            ctx.lineTo(nextPoint.x, nextPoint.y)
            ctx.stroke()
          }
        }

        // Draw meteor head with glow
        const headGradient = ctx.createRadialGradient(
          meteor.x, meteor.y, 0,
          meteor.x, meteor.y, 5
        )
        headGradient.addColorStop(0, `rgba(255, 255, 255, ${meteor.opacity})`)
        headGradient.addColorStop(0.5, `rgba(200, 220, 255, ${meteor.opacity * 0.8})`)
        headGradient.addColorStop(1, `rgba(150, 180, 255, ${meteor.opacity * 0.2})`)

        ctx.fillStyle = headGradient
        ctx.beginPath()
        ctx.arc(meteor.x, meteor.y, 3, 0, Math.PI * 2)
        ctx.fill()

        // Add bright glow
        ctx.shadowBlur = 15
        ctx.shadowColor = `rgba(200, 220, 255, ${meteor.opacity})`
        ctx.beginPath()
        ctx.arc(meteor.x, meteor.y, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Keep meteor if still visible and on screen
        return (
          meteor.opacity > 0 &&
          meteor.x > -100 &&
          meteor.x < canvas.width + 100 &&
          meteor.y > -100 &&
          meteor.y < canvas.height + 100
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
