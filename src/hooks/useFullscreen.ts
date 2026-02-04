import { useState, useEffect, useCallback } from 'react'
import { logger } from '../utils/logger'

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const getFullscreenElement = (): Element | null => {
    return (
      document.fullscreenElement ||
      (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
      (document as unknown as { mozFullScreenElement?: Element }).mozFullScreenElement ||
      (document as unknown as { msFullscreenElement?: Element }).msFullscreenElement ||
      null
    )
  }

  const enterFullscreen = useCallback(() => {
    const element = document.documentElement

    if (element.requestFullscreen) {
      element.requestFullscreen().catch((error) => {
        logger.error('Error attempting to enable fullscreen', error, {
          feature: 'fullscreen',
          action: 'enter',
        })
      })
    } else if ((element as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
      (element as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen()
    } else if ((element as unknown as { mozRequestFullScreen?: () => void }).mozRequestFullScreen) {
      (element as unknown as { mozRequestFullScreen: () => void }).mozRequestFullScreen()
    } else if ((element as unknown as { msRequestFullscreen?: () => void }).msRequestFullscreen) {
      (element as unknown as { msRequestFullscreen: () => void }).msRequestFullscreen()
    }
  }, [])

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch((error) => {
        logger.error('Error attempting to exit fullscreen', error, {
          feature: 'fullscreen',
          action: 'exit',
        })
      })
    } else if ((document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
      (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen()
    } else if ((document as unknown as { mozCancelFullScreen?: () => void }).mozCancelFullScreen) {
      (document as unknown as { mozCancelFullScreen: () => void }).mozCancelFullScreen()
    } else if ((document as unknown as { msExitFullscreen?: () => void }).msExitFullscreen) {
      (document as unknown as { msExitFullscreen: () => void }).msExitFullscreen()
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!getFullscreenElement())
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen])

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  }
}
