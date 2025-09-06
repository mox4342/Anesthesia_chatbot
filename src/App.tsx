import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Home, MessageSquare, Calculator, FileText, Newspaper, Menu, X, Database, BookOpen } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Calculators from './pages/Calculators'
import Protocols from './pages/Protocols'
import News from './pages/News'
import KnowledgeBase from './pages/KnowledgeBase'
import CaseLearning from './pages/CaseLearning'

const App: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Case Learning', href: '/cases', icon: BookOpen },
    { name: 'Calculators', href: '/calculators', icon: Calculator },
    { name: 'Protocols', href: '/protocols', icon: FileText },
    { name: 'Knowledge Base', href: '/knowledge', icon: Database },
    { name: 'News', href: '/news', icon: Newspaper },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">AA</span>
              </div>
              <span className="font-bold text-xl hidden sm:block">Anesthesia Assistant</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/cases" element={<CaseLearning />} />
          <Route path="/calculators" element={<Calculators />} />
          <Route path="/protocols" element={<Protocols />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/news" element={<News />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2024 AI Anesthesia Assistant. For educational purposes only.
          </p>
          <p className="text-xs mt-2 text-gray-400">
            Always verify information with institutional protocols and primary sources.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App