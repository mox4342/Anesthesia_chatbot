import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import MedicalDisclaimer from '../components/common/MedicalDisclaimer'
import claudeService from '../services/api/claude.service'

interface Message {
  id: string
  text: string
  sender: 'user' | 'assistant'
  timestamp: Date
  citations?: Array<{ title: string; url: string }>
  error?: boolean
}

interface Context {
  patientAge?: string
  procedure?: string
  comorbidities?: string[]
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I am your AI Anesthesia Assistant powered by Claude. I can help you with evidence-based information about anesthesia, drug dosing, and clinical protocols. How can I assist you today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const [context, setContext] = useState<Context>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isApiConfigured = claudeService.isConfigured()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Prepare conversation history for Claude (limit to last 10 messages)
      const conversationHistory = messages
        .slice(-10)
        .filter(m => m.sender === 'user' || m.sender === 'assistant')
        .map(m => ({
          role: m.sender as 'user' | 'assistant',
          content: m.text
        }))

      // Call Claude API
      const { response, citations } = await claudeService.sendMessage(
        input,
        showContext && (context.patientAge || context.procedure || context.comorbidities?.length) 
          ? context 
          : undefined,
        conversationHistory
      )

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date(),
        citations: citations.length > 0 ? citations : undefined
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I encountered an error processing your request. Please try again later.',
        sender: 'assistant',
        timestamp: new Date(),
        error: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const suggestedQuestions = [
    'What is the recommended propofol dose for induction?',
    'How do I manage malignant hyperthermia?',
    'What are the contraindications for succinylcholine?',
    'Explain the difference between spinal and epidural anesthesia'
  ]

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl h-screen flex flex-col">
      <MedicalDisclaimer prominent={true} dismissible={false} position="top" />
      
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">AI Chat Assistant</h1>
        <p className="text-gray-600">Ask questions about anesthesia and clinical protocols</p>
        {!isApiConfigured && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-yellow-600 mt-0.5" size={16} />
            <p className="text-sm text-yellow-700">
              Claude API key not configured. Add your key to .env.local to enable AI responses.
            </p>
          </div>
        )}
      </div>

      {/* Context Panel */}
      <div className="mb-4">
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Sparkles size={16} />
          {showContext ? 'Hide' : 'Add'} Clinical Context
        </button>
        
        {showContext && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
            <input
              type="text"
              placeholder="Patient age (e.g., 65 years)"
              value={context.patientAge || ''}
              onChange={(e) => setContext({ ...context, patientAge: e.target.value })}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Procedure (e.g., total knee replacement)"
              value={context.procedure || ''}
              onChange={(e) => setContext({ ...context, procedure: e.target.value })}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Comorbidities (comma-separated)"
              value={context.comorbidities?.join(', ') || ''}
              onChange={(e) => setContext({ 
                ...context, 
                comorbidities: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl p-4 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.error
                    ? 'bg-red-50 text-red-900 border border-red-200'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-sm font-semibold mb-2">📚 References:</p>
                    {message.citations.map((citation, index) => (
                      <a
                        key={index}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm underline hover:no-underline block mb-1"
                      >
                        {citation.title}
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-xs mt-2 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-4 rounded-lg">
                <Loader2 className="animate-spin" size={20} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about anesthesia, drug dosing, or protocols..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="btn-primary flex items-center gap-2"
        >
          <Send size={20} />
          Send
        </button>
      </form>
    </div>
  )
}

export default Chat