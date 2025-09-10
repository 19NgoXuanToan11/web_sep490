import AppRouter from './app/router'
import { Toaster } from '@/shared/ui/toaster'
import { useEffect } from 'react'
import { useAuthStore } from '@/shared/store/authStore'
import '@/shared/ui/AutofillFix.css'

function App() {
  const loadFromStorage = useAuthStore(s => s.loadFromStorage)
  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])
  return (
    <div className="App">
      <AppRouter />
      <Toaster />
    </div>
  )
}

export default App
