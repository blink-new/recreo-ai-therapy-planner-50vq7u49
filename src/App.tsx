import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { Dashboard } from '@/pages/Dashboard'
import { PlanGenerator } from '@/pages/PlanGenerator'
import { PatientProfiles } from '@/pages/PatientProfiles'
import { PlanLibrary } from '@/pages/PlanLibrary'
import { blink } from '@/blink/client'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Recreo...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Recreo</h1>
          <p className="text-gray-600 mb-8">
            AI-powered therapy plan generator for recreational therapists. 
            Create personalized, evidence-based treatment plans in minutes.
          </p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In to Get Started
          </button>
        </div>
      </div>
    )
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} />
      case 'generator':
        return <PlanGenerator />
      case 'patients':
        return <PatientProfiles />
      case 'library':
        return <PlanLibrary />
      default:
        return <Dashboard onTabChange={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <div className="flex">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 lg:ml-72">
          <div className="p-6 lg:p-8">
            {renderActiveTab()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App