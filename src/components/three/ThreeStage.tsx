import { Suspense } from 'react'
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react'
import { ThreeErrorBoundary } from './ThreeErrorBoundary'
import { useShouldRender3D } from './useShouldRender3D'

/**
 * Mounts a lazily-loaded 3D scene only when 3D is allowed on this device.
 * Otherwise — or if the scene crashes — the static `fallback` is shown.
 * The scene chunk (three.js) is only downloaded when this mounts.
 */
export function ThreeStage({
  scene: Scene,
  fallback,
  className = '',
  label,
}: {
  scene: LazyExoticComponent<ComponentType<Record<string, never>>>
  fallback: ReactNode
  className?: string
  label?: string
}) {
  const ok = useShouldRender3D()
  if (!ok) {
    return (
      <div className={className} aria-label={label}>
        {fallback}
      </div>
    )
  }
  return (
    <div className={className} aria-label={label}>
      <ThreeErrorBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <Scene />
        </Suspense>
      </ThreeErrorBoundary>
    </div>
  )
}
