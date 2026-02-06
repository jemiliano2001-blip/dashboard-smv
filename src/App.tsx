import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingState } from './components/LoadingState'
import { EnvSetupError } from './components/EnvSetupError'
import { getEnvValidationResult } from '@/lib/supabase'
import { useAppearanceSettings } from './hooks/useAppearanceSettings'
import { queryClient } from './lib/queryClient'
import './styles/index.css'
import './styles/print.css'

const TVDashboard = lazy(() => import('./components/TVDashboard').then(module => ({ default: module.TVDashboard })))
const AdminPanel = lazy(() => import('./components/AdminPanel').then(module => ({ default: module.AdminPanel })))
const StatsDashboard = lazy(() => import('@/features/analytics').then(m => ({ default: m.StatsDashboard })))
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout').then(module => ({ default: module.DashboardLayout })))

const THEME_STORAGE_KEY = 'theme-preference'

function App() {
  const [envCheck, setEnvCheck] = useState<ReturnType<typeof getEnvValidationResult> | null>(null)
  useAppearanceSettings()

  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    root.classList.remove('dark')
    root.classList.add('light')
    body.classList.remove('dark')
    body.classList.add('light')
    localStorage.removeItem(THEME_STORAGE_KEY)
  }, [])

  useEffect(() => {
    setEnvCheck(getEnvValidationResult())
  }, [])

  // Show loading while checking env
  if (envCheck === null) {
    return <LoadingState />
  }

  // Show env setup error when validation fails (missing vars or invalid values)
  if (!envCheck.valid) {
    return (
      <EnvSetupError
        missingVariables={envCheck.missing}
        validationErrors={envCheck.errors}
      />
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary showDetails={import.meta.env.DEV}>
        <BrowserRouter>
          <Suspense fallback={<LoadingState />}>
            <Routes>
              <Route path="/" element={<Outlet />}>
                <Route index element={<TVDashboard />} />
                <Route element={<DashboardLayout />}>
                  <Route path="admin/*" element={<AdminPanel />} />
                  <Route path="stats" element={<StatsDashboard />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

export default App
