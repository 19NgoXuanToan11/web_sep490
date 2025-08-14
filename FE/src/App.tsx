import AppRouter from './app/router'
import { Toaster } from '@/shared/ui/toaster'

function App() {
  return (
    <div className="App">
      <AppRouter />
      <Toaster />
    </div>
  )
}

export default App
