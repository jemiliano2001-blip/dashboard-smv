import { useEffect } from 'react'
import { useAppSettings } from './useAppSettings'
import type { Density, FontSize, Contrast } from '../types'

export function useAppearanceSettings() {
  const { settings } = useAppSettings()

  useEffect(() => {
    const body = document.body
    const html = document.documentElement

    // Apply density classes
    const densityClasses: Density[] = ['compact', 'comfortable', 'spacious']
    densityClasses.forEach((density) => {
      body.classList.remove(`density-${density}`)
    })
    body.classList.add(`density-${settings.appearance.density}`)

    // Apply font size classes
    const fontSizeClasses: FontSize[] = ['small', 'medium', 'large']
    fontSizeClasses.forEach((size) => {
      html.classList.remove(`font-size-${size}`)
    })
    html.classList.add(`font-size-${settings.appearance.fontSize}`)

    // Apply contrast classes
    const contrastClasses: Contrast[] = ['normal', 'high']
    contrastClasses.forEach((contrast) => {
      body.classList.remove(`contrast-${contrast}`)
    })
    body.classList.add(`contrast-${settings.appearance.contrast}`)

    // Apply animations
    if (settings.appearance.animationsEnabled) {
      body.classList.remove('animations-disabled')
      body.classList.add('animations-enabled')
      html.style.setProperty('--animation-duration', '0.3s')
      html.style.setProperty('--transition-duration', '0.3s')
    } else {
      body.classList.remove('animations-enabled')
      body.classList.add('animations-disabled')
      html.style.setProperty('--animation-duration', '0s')
      html.style.setProperty('--transition-duration', '0s')
    }
  }, [settings.appearance])
}
