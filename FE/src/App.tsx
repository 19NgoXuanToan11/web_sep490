import AppRouter from './app/router'

/**
 * Main App Component
 *
 * This is the root component that provides:
 * - Router configuration
 * - Global providers (to be added: QueryClient, Auth, Theme, i18n)
 * - Error boundaries
 * - Global styles
 */
function App() {
  return (
    <div className="App">
      <AppRouter />
    </div>
  )
}

export default App
