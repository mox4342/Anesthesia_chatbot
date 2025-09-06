import React, { useState, useRef, useEffect } from 'react';
import { Send, BookOpen, AlertCircle, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

interface Case {
  caseDate: string;
  patient: any;
  procedure: any;
  complications?: any[];
  keyTakeaways?: string[];
  clinicalPearls?: string[];
  keywords: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cases?: Case[];
  timestamp: Date;
}

export const CaseBasedLearning: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to Case-Based Learning! I have access to 45 real clinical cases including cardiac arrests, massive transfusions, complex procedures, and critical emergencies. Ask me about specific scenarios, complications, or management strategies.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [showCaseList, setShowCaseList] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load all cases on component mount
    fetchAllCases();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchAllCases = async () => {
    try {
      const response = await axios.get('/api/cases/all');
      setAllCases(response.data.cases || []);
    } catch (error) {
      console.error('Failed to load cases:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/cases/search', {
        query: input,
        includeDetails: true
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        cases: response.data.relevantCases,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error searching the cases. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQueries = [
    "OSA patient with spinal anesthesia",
    "Managing massive transfusion",
    "Awake craniotomy technique",
    "Liver transplant reperfusion",
    "Pediatric trauma management",
    "Placental abruption with DIC"
  ];

  const getCaseSummary = (caseData: Case) => {
    const age = `${caseData.patient.age}${caseData.patient.ageUnit?.[0] || 'y'}`;
    const complications = caseData.complications?.length || 0;
    return `${age} ${caseData.patient.sex} - ${caseData.procedure.name} ${complications > 0 ? `(${complications} complications)` : ''}`;
  };

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Case-Based Learning</h1>
                <p className="text-purple-100">Learn from 45 real clinical cases with complications and outcomes</p>
              </div>
            </div>
            <button
              onClick={() => setShowCaseList(!showCaseList)}
              className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition"
            >
              <Filter className="w-5 h-5" />
              <span>Browse Cases ({allCases.length})</span>
              {showCaseList ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>
        </div>

        {/* Suggested Queries */}
        <div className="bg-purple-50 p-3 border-b">
          <p className="text-sm text-gray-600 mb-2">Try asking about:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => setInput(query)}
                className="text-xs bg-white px-3 py-1 rounded-full border border-purple-300 hover:bg-purple-100 transition"
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white border border-gray-200 shadow'
                }`}
              >
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Display relevant cases if any */}
                {message.cases && message.cases.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-purple-700">📋 Relevant Cases Found:</p>
                    {message.cases.map((caseData, idx) => (
                      <div key={idx} className="bg-purple-50 p-3 rounded border border-purple-200">
                        <p className="font-medium text-sm">{getCaseSummary(caseData)}</p>
                        {caseData.complications && caseData.complications.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-red-600 font-semibold">Complications:</p>
                            <ul className="text-xs text-gray-700 mt-1">
                              {caseData.complications.map((comp, i) => (
                                <li key={i}>• {comp.event}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {caseData.keyTakeaways && (
                          <div className="mt-2">
                            <p className="text-xs text-green-600 font-semibold">Key Takeaways:</p>
                            <ul className="text-xs text-gray-700 mt-1">
                              {caseData.keyTakeaways.slice(0, 2).map((takeaway, i) => (
                                <li key={i}>• {takeaway}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                  <span className="text-gray-600">Searching cases...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about specific cases, complications, or management strategies..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>Search Cases</span>
            </button>
          </div>
        </form>
      </div>

      {/* Case List Sidebar */}
      {showCaseList && (
        <div className="w-96 border-l bg-gray-50 overflow-y-auto">
          <div className="p-4 bg-white border-b">
            <h3 className="font-semibold text-lg">Clinical Case Library</h3>
            <p className="text-sm text-gray-600">Click to view case details</p>
          </div>
          <div className="p-4 space-y-3">
            {allCases.map((caseData, index) => (
              <div
                key={index}
                onClick={() => setSelectedCase(caseData)}
                className="bg-white p-3 rounded-lg border hover:border-purple-400 cursor-pointer transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{getCaseSummary(caseData)}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {caseData.procedure.specialty} • {caseData.procedure.urgency}
                    </p>
                    {caseData.outcome?.criticalIncident && (
                      <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                        Critical Incident
                      </span>
                    )}
                    {caseData.complications && caseData.complications.length > 0 && (
                      <span className="inline-block mt-2 ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                        {caseData.complications.length} Complications
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {caseData.keywords.slice(0, 3).map((keyword, i) => (
                    <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Case Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedCase.procedure.name}</h2>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-purple-600">Patient Details</h3>
                <p>{getCaseSummary(selectedCase)}</p>
                <p className="text-sm text-gray-600">ASA: {selectedCase.patient.asa}</p>
              </div>
              
              {selectedCase.complications && selectedCase.complications.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg text-red-600">Complications</h3>
                  {selectedCase.complications.map((comp, i) => (
                    <div key={i} className="bg-red-50 p-3 rounded mt-2">
                      <p className="font-medium">{comp.event}</p>
                      <p className="text-sm mt-1">Management: {comp.management}</p>
                      <p className="text-sm">Outcome: {comp.outcome}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedCase.keyTakeaways && (
                <div>
                  <h3 className="font-semibold text-lg text-green-600">Key Takeaways</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedCase.keyTakeaways.map((takeaway, i) => (
                      <li key={i} className="text-sm">{takeaway}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCase.clinicalPearls && (
                <div>
                  <h3 className="font-semibold text-lg text-blue-600">Clinical Pearls</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedCase.clinicalPearls.slice(0, 5).map((pearl, i) => (
                      <li key={i} className="text-sm">{pearl}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};