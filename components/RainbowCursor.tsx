"use client"

import { useEffect, useRef } from "react"
import { useColorModeValue } from "./ui/color-mode"

interface Particle {
  x: number
  y: number
  hue: number
  createdAt: number
  size: number
}

export default function RainbowCursor() {
  const shouldShow = useColorModeValue(true, false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef(0)
  const hueRef = useRef(0)

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
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      
      // Add new particles
      for (let i = 0; i < 3; i++) {
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          hue: hueRef.current,
          createdAt: Date.now(),
          size: Math.random() * 3 + 2,
        })
      }
      
      // Update hue for rainbow effect
      hueRef.current = (hueRef.current + 2) % 360
    }

    window.addEventListener("mousemove", handleMouseMove)

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const now = Date.now()
      const maxAge = 2000 // 2 seconds

      // Remove old particles
      particlesRef.current = particlesRef.current.filter(
        (p) => now - p.createdAt < maxAge
      )

      // Draw particles
      particlesRef.current.forEach((particle, index) => {
        const age = now - particle.createdAt
        const progress = age / maxAge
        const opacity = 1 - progress
        
        // Create gradient for each particle
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 2
        )
        gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 60%, ${opacity})`)
        gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 50%, ${opacity * 0.3})`)
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * (1 - progress * 0.5), 0, Math.PI * 2)
        ctx.fill()
        
        // Add glow effect
        ctx.shadowBlur = 10
        ctx.shadowColor = `hsl(${particle.hue}, 100%, 60%)`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * (1 - progress * 0.5), 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
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
        zIndex: 9999,
      }}
    />
  )
}
