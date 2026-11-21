import { useState } from 'react'

/**
 * Synchronous check (client-rendered app, no SSR): is WebGL available,
 * and is this a fine-pointer device without a reduced-motion preference?
 * Used to decide at first render whether a 3D scene mounts at all —
 * computing it in the state initialiser avoids a fallback → 3D flash.
 */
export function shouldRender3D(): boolean {
  if (typeof window === 'undefined') return false
  let webgl = false
  try {
    const canvas = document.createElement('canvas')
    webgl = !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    webgl = false
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const coarse = window.matchMedia('(pointer: coarse)').matches
  return webgl && !reduced && !coarse
}

/**
 * Decides whether the 3D scenes should mount at all.
 * 3D is skipped (static flat hero/crest shown instead) when:
 * - WebGL is unavailable, or
 * - the user prefers reduced motion, or
 * - the device is a coarse-pointer (touch) device — mobile / low-end.
 * Never renders a blank or broken section.
 */
export function useShouldRender3D(): boolean {
  const [ok] = useState(() => shouldRender3D())
  return ok
}
