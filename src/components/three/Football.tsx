import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { createFootballTexture } from './ballTexture'

interface FootballProps {
  position?: [number, number, number]
  scale?: number
  /** Rotations per second around Y. */
  spin?: number
  /** React to the pointer (tilt). Off for small decorative balls. */
  interactive?: boolean
  /** Gentle vertical bob. */
  float?: boolean
}

/**
 * A football: sphere with a procedural pentagon texture, slow spin,
 * gentle bob and pointer tilt. The pointer is tracked on the window so
 * the tilt works even though the canvas sits behind the page content.
 */
export function Football({
  position = [0, 0, 0],
  scale = 1,
  spin = 0.22,
  interactive = true,
  float = true,
}: FootballProps) {
  const group = useRef<THREE.Group>(null)
  const texture = useMemo(() => createFootballTexture(), [])
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  useEffect(() => {
    if (!interactive) return
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [interactive])

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.rotation.y += dt * spin * Math.PI * 2 * 0.4
    if (float) {
      g.position.y = position[1] + Math.sin(t * 0.8) * 0.14
    }
    if (interactive) {
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, pointer.current.y * 0.28, 0.045)
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, -pointer.current.x * 0.18, 0.045)
    }
  })

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[1.55, 64, 64]} />
        <meshStandardMaterial map={texture} roughness={0.55} metalness={0.05} />
      </mesh>
    </group>
  )
}
