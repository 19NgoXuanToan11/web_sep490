import AppRouter from './app/router'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import { useAuthStore } from '@/shared/store/authStore'
import '@/shared/ui/AutofillFix.css'
import ErrorBoundary from '@/shared/ui/ErrorBoundary'

function App() {
  const loadFromStorage = useAuthStore(s => s.loadFromStorage)
  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])
  return (
    <div className="App">
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
      <Toaster />
    </div>
  )
}

export default App
