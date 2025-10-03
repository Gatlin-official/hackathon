'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getStressAnalyzer, StressAnalysis } from '@/lib/stress-analyzer'
import { Message, MessageStressAnalysis } from '@/types'

interface PersonalDashboardProps {
  onClose: () => void
}

export default function PersonalDashboard({ onClose }: PersonalDashboardProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [stressAnalyses, setStressAnalyses] = useState<MessageStressAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzingMessages, setAnalyzingMessages] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'high-stress' | 'critical'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'stress'>('date')

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserMessages()
    }
  }, [session?.user?.email])

  const fetchUserMessages = async () => {
    try {
      setLoading(true)
      
      // Fetch comprehensive stress analyses
      const response = await fetch(`http://localhost:3003/api/user/${session?.user?.email}/comprehensive-analyses`)
      
      if (response.ok) {
        const comprehensiveAnalyses = await response.json()
        
        // Transform comprehensive analyses to message format for display
        const messagesFromAnalyses = comprehensiveAnalyses.map((analysis: any) => ({
          id: analysis.messageId,
          text: analysis.messageText,
          senderEmail: analysis.userEmail,
          senderName: session?.user?.name || 'You',
          timestamp: analysis.timestamp,
          stressAnalysis: {
            id: analysis.id,
            messageId: analysis.messageId,
            stressLevel: analysis.stressScore,
            stressIndicators: [],
            emotions: [],
            riskLevel: analysis.stressScore > 7 ? 'high' : analysis.stressScore > 4 ? 'medium' : 'low',
            aiSolution: analysis.aiAdvice || null,
            suggestions: analysis.aiAdvice ? [analysis.aiAdvice] : [],
            confidence: 0.9,
            analyzedAt: analysis.analyzedAt
          }
        }))
        
        setMessages(messagesFromAnalyses)
      } else {
        console.error('Failed to fetch comprehensive analyses')
        setMessages([])
      }
    } catch (error) {
      console.error('Error fetching comprehensive analyses:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }



  const getFilteredMessages = () => {
    let filtered = messages

    switch (filter) {
      case 'high-stress':
        filtered = messages.filter(msg => msg.stressAnalysis && msg.stressAnalysis.stressLevel >= 6)
        break
      case 'critical':
        filtered = messages.filter(msg => msg.stressAnalysis && msg.stressAnalysis.stressLevel >= 8)
        break
      default:
        filtered = messages
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'stress') {
        const aStress = a.stressAnalysis?.stressLevel || 0
        const bStress = b.stressAnalysis?.stressLevel || 0
        return bStress - aStress
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }

  const getStressColor = (level: number) => {
    if (level >= 8) return 'text-red-600 bg-red-50'
    if (level >= 6) return 'text-orange-600 bg-orange-50'
    if (level >= 4) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getStressBorderColor = (level: number) => {
    if (level >= 8) return 'border-l-red-500'
    if (level >= 6) return 'border-l-orange-500'
    if (level >= 4) return 'border-l-yellow-500'
    return 'border-l-green-500'
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredMessages = getFilteredMessages()
  const totalMessages = messages.length
  const highStressMessages = messages.filter(msg => msg.stressAnalysis && msg.stressAnalysis.stressLevel >= 6).length
  const avgStressLevel = messages.length > 0 
    ? messages.reduce((sum, msg) => sum + (msg.stressAnalysis?.stressLevel || 0), 0) / messages.length 
    : 0

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span>Loading your message history...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Personal Dashboard</h2>
            <p className="text-gray-600">Your message history with AI stress analysis</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700">Total Messages</h3>
            <p className="text-3xl font-bold text-blue-600">{totalMessages}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700">High Stress Messages</h3>
            <p className="text-3xl font-bold text-orange-600">{highStressMessages}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700">Average Stress Level</h3>
            <p className={`text-3xl font-bold ${getStressColor(avgStressLevel).split(' ')[0]}`}>
              {avgStressLevel.toFixed(1)}/10
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 p-6 border-b">
          <div className="flex gap-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            {[
              { value: 'all', label: 'All Messages' },
              { value: 'high-stress', label: 'High Stress (6+)' },
              { value: 'critical', label: 'Critical (8+)' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value as any)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  filter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            {[
              { value: 'date', label: 'Date' },
              { value: 'stress', label: 'Stress Level' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSortBy(value as any)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  sortBy === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p>No messages found matching your filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`bg-white rounded-lg p-4 border-l-4 shadow-sm ${
                    message.stressAnalysis 
                      ? getStressBorderColor(message.stressAnalysis.stressLevel)
                      : 'border-l-gray-300'
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{formatDate(message.timestamp)}</span>
                      {message.intention && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {message.intention}
                        </span>
                      )}
                      {message.stressAnalysis && (
                        <span className={`px-2 py-1 text-xs rounded-full ${getStressColor(message.stressAnalysis.stressLevel)}`}>
                          Stress: {message.stressAnalysis.stressLevel}/10
                        </span>
                      )}
                    </div>
                    {analyzingMessages.has(message.id) && (
                      <div className="flex items-center text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        Analyzing...
                      </div>
                    )}
                  </div>

                  {/* Message Text */}
                  <p className="text-gray-800 mb-3 whitespace-pre-wrap">{message.text}</p>

                  {/* Stress Analysis */}
                  {message.stressAnalysis && (
                    <div className="border-t pt-3 mt-3">
                      {/* Emotions & Indicators */}
                      {(message.stressAnalysis.emotions.length > 0 || message.stressAnalysis.stressIndicators.length > 0) && (
                        <div className="mb-3">
                          {message.stressAnalysis.emotions.length > 0 && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-600">Emotions: </span>
                              <div className="inline-flex flex-wrap gap-1">
                                {message.stressAnalysis.emotions.map((emotion, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                    {emotion}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {message.stressAnalysis.stressIndicators.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">Stress Indicators: </span>
                              <div className="inline-flex flex-wrap gap-1">
                                {message.stressAnalysis.stressIndicators.map((indicator, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                    {indicator}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI Solution for High Stress Messages */}
                      {message.stressAnalysis.stressLevel > 5 && message.stressAnalysis.aiSolution && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h4 className="font-medium text-blue-800 mb-2">🤖 AI Support & Guidance:</h4>
                          <p className="text-blue-700 text-sm whitespace-pre-wrap">
                            {message.stressAnalysis.aiSolution}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
