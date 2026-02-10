import { useEffect, useCallback } from 'react'

type KeyboardShortcutCallback = (event: KeyboardEvent) => void
type KeyboardShortcuts = Record<string, KeyboardShortcutCallback>

/**
 * Hook for managing keyboard shortcuts
 * @param shortcuts - Object mapping key combinations to callbacks
 * @param enabled - Whether shortcuts are enabled (default: true)
 * 
 * @example
 * useKeyboardShortcuts({
 *   'ctrl+k': () => focusSearch(),
 *   'ctrl+n': () => createNew(),
 *   'escape': () => cancel(),
 * })
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts, enabled = true): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Build key combination string
      const parts: string[] = []
      if (event.ctrlKey || event.metaKey) parts.push(event.metaKey ? 'cmd' : 'ctrl')
      if (event.altKey) parts.push('alt')
      if (event.shiftKey) parts.push('shift')
      
      const key = event.key?.toLowerCase() ?? ''
      if (key && key !== 'control' && key !== 'meta' && key !== 'alt' && key !== 'shift') {
        parts.push(key)
      }

      const combination = parts.join('+')
      const callback = shortcuts[combination] || (key ? shortcuts[key] : undefined)

      if (callback) {
        event.preventDefault()
        callback(event)
      }
    },
    [shortcuts, enabled]
  )

  useEffect(() => {
    if (!enabled) return () => {}

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

/**
 * Hook for single keyboard shortcut
 * @param key - Key combination (e.g., 'ctrl+k', 'escape')
 * @param callback - Callback function
 * @param enabled - Whether shortcut is enabled
 */
export function useKeyboardShortcut(
  key: string,
  callback: KeyboardShortcutCallback,
  enabled = true
): void {
  useKeyboardShortcuts({ [key]: callback }, enabled)
}
