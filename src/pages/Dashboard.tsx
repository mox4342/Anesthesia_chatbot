import React from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Calculator, FileText, Newspaper } from 'lucide-react'
import MedicalDisclaimer from '../components/common/MedicalDisclaimer'

const Dashboard: React.FC = () => {
  const features = [
    {
      title: 'AI Chat Assistant',
      description: 'Ask questions about anesthesia and get evidence-based answers',
      icon: MessageSquare,
      link: '/chat',
      color: 'bg-blue-500'
    },
    {
      title: 'Drug Calculators',
      description: 'Calculate drug dosages for various procedures',
      icon: Calculator,
      link: '/calculators',
      color: 'bg-green-500'
    },
    {
      title: 'Emergency Protocols',
      description: 'Quick access to critical emergency procedures',
      icon: FileText,
      link: '/protocols',
      color: 'bg-red-500'
    },
    {
      title: 'Medical News',
      description: 'Latest research and updates from medical journals',
      icon: Newspaper,
      link: '/news',
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <MedicalDisclaimer prominent={true} dismissible={false} position="top" />
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          AI Anesthesia Assistant
        </h1>
        <p className="text-lg text-gray-600">
          Evidence-based anesthesia information and clinical decision support
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Link
              key={feature.link}
              to={feature.link}
              className="card hover:shadow-xl transition-shadow duration-300 flex flex-col"
            >
              <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="text-white" size={24} />
              </div>
              <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
              <p className="text-gray-600 flex-grow">{feature.description}</p>
              <div className="mt-4 text-blue-600 font-semibold">
                Access →
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-12 card">
        <h2 className="text-2xl font-bold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Articles Searched</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">5</div>
            <div className="text-sm text-gray-600">Protocols Available</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">8</div>
            <div className="text-sm text-gray-600">Drug Calculators</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard