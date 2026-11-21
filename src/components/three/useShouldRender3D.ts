import { useState } from 'react'

/**
 * Synchronous check (client-rendered app, no SSR): is WebGL available, and
 * does the user NOT prefer reduced motion? Used to decide at first render
 * whether a 3D scene mounts at all — computing it in the state initialiser
 * avoids a fallback → 3D flash.
 *
 * NOTE: there is deliberately NO coarse-pointer (touch) gate here. Phones
 * get the 3D scenes too — the scenes auto-spin, respond to touch drag and
 * tap, and pause their render loop off-screen, so they stay cheap on
 * mid-range devices.
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
  return webgl && !reduced
}

/**
 * Decides whether the 3D scenes should mount at all.
 * 3D is skipped (static flat hero/crest shown instead) only when:
 * - WebGL is unavailable, or
 * - the user prefers reduced motion.
 * Touch devices are NOT excluded — they get the full interactive scenes.
 * Never renders a blank or broken section.
 */
export function useShouldRender3D(): boolean {
  const [ok] = useState(() => shouldRender3D())
  return ok
}
