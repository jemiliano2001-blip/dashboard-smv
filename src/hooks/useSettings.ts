import { useAppSettings } from './useAppSettings'

/**
 * Hook to get current dashboard settings (backward compatibility)
 */
export function useSettings() {
  const { settings } = useAppSettings()
  return settings.dashboard
}
