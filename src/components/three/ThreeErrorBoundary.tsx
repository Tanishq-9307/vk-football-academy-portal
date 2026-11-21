import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode
}

interface State {
  failed: boolean
}

/**
 * Catches WebGL / scene crashes (e.g. context creation failing on a
 * low-end device) and swaps in the static fallback instead of a blank
 * or broken section.
 */
export class ThreeErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(): void {
    // Fallback UI is already rendered; nothing else to do.
  }

  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}
