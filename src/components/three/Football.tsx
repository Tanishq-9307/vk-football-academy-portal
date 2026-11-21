import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { createFootballTexture } from './ballTexture'
import { stepInteraction, type InteractionState } from './useInteraction'

interface FootballProps {
  position?: [number, number, number]
  scale?: number
  /** Rotations per second around Y (auto-spin, paused while dragging). */
  spin?: number
  /** React to the pointer (hover tilt). Off for small decorative balls. */
  interactive?: boolean
  /** Gentle vertical bob. */
  float?: boolean
  /**
   * Shared interaction state (drag / kick / bounce / scroll). When present
   * the ball is fully interactive: drag to rotate with momentum, tap to
   * kick (spin burst + bounce + gold flash). When absent it just spins.
   */
  interaction?: InteractionState
  /** Let scroll progress rotate the ball and pull the camera in. Needs `interaction`. */
  scrollRig?: boolean
}

/**
 * A football: sphere with a procedural pentagon texture, slow spin,
 * gentle bob and pointer tilt. With an `interaction` state it becomes
 * draggable (mouse + touch), kickable (tap/click → spin burst, bounce,
 * squash on landing, gold flash) and scroll-reactive.
 * The pointer is tracked on the window so the hover tilt works even
 * though the canvas sits behind the page content.
 */
export function Football({
  position = [0, 0, 0],
  scale = 1,
  spin = 0.22,
  interactive = true,
  float = true,
  interaction,
  scrollRig = false,
}: FootballProps) {
  const group = useRef<THREE.Group>(null)
  const flash = useRef<THREE.Mesh>(null)
  const texture = useMemo(() => createFootballTexture(), [])
  const pointer = useRef({ x: 0, y: 0 })
  const tilt = useRef({ x: 0, z: 0 })
  const spinAngle = useRef(0)
  const baseZ = useRef<number | null>(null)

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
    const d = Math.min(Math.max(dt, 0), 0.05)
    const inter = interaction

    // Auto-spin pauses while the user is dragging.
    if (!inter || !inter.dragging) {
      spinAngle.current += d * spin * Math.PI * 2 * 0.4
    }

    let rotY = spinAngle.current
    let rotX = 0
    let y = position[1]
    let squash = 0
    let kick = 0

    if (inter) {
      stepInteraction(inter, d)
      rotY += inter.rotY
      rotX += inter.rotX
      y += inter.bounce
      squash = inter.squash
      kick = inter.kick
      if (scrollRig) {
        // Scroll-linked motion: the ball turns as the hero scrolls away
        // and the camera pulls in slightly.
        rotY += inter.scroll * Math.PI
        if (baseZ.current === null) baseZ.current = state.camera.position.z
        state.camera.position.z = THREE.MathUtils.lerp(
          baseZ.current,
          baseZ.current - 1.1,
          inter.scroll,
        )
      }
    }

    // Hover tilt (mouse only) — eases to zero while dragging so it never
    // fights the drag rotation.
    if (interactive) {
      const targetX = inter?.dragging ? 0 : pointer.current.y * 0.28
      const targetZ = inter?.dragging ? 0 : -pointer.current.x * 0.18
      tilt.current.x = THREE.MathUtils.lerp(tilt.current.x, targetX, 0.045)
      tilt.current.z = THREE.MathUtils.lerp(tilt.current.z, targetZ, 0.045)
    }

    if (float) {
      y += Math.sin(t * 0.8) * 0.14
    }

    g.rotation.set(rotX + tilt.current.x, rotY, tilt.current.z)
    g.position.y = y
    // Squash on landing, slight stretch sideways.
    g.scale.set(
      scale * (1 + 0.1 * squash),
      scale * (1 - 0.16 * squash),
      scale * (1 + 0.1 * squash),
    )

    // Gold flash shell — visible only while a kick is bursting.
    if (flash.current) {
      const mat = flash.current.material as THREE.MeshBasicMaterial
      mat.opacity = kick * 0.45
      flash.current.scale.setScalar(1 + (1 - kick) * 0.35)
    }
  })

  return (
    <group ref={group} position={position}>
      <mesh>
        <sphereGeometry args={[1.55, 64, 64]} />
        <meshStandardMaterial map={texture} roughness={0.55} metalness={0.05} />
      </mesh>
      {/* Kick flash: additive gold shell, driven by interaction.kick */}
      <mesh ref={flash} scale={1.35}>
        <sphereGeometry args={[1.62, 32, 32]} />
        <meshBasicMaterial
          color="#d4af37"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
