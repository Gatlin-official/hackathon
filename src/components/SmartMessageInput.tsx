'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getStressAnalyzer, StressAnalysis, MessageContext } from '@/lib/stress-analyzer'
import StressAlert from './StressAlert'
import { debounce } from 'lodash'

interface SmartMessageInputProps {
  onSendMessage: (text: string, intention?: 'venting' | 'advice' | 'urgent' | null) => void
  groupId: string
}

export default function SmartMessageInput({ onSendMessage, groupId }: SmartMessageInputProps) {
  const { data: session } = useSession()
  const [message, setMessage] = useState('')
  const [intention, setIntention] = useState<'venting' | 'advice' | 'urgent' | null>(null)
  const [stressAnalysis, setStressAnalysis] = useState<StressAnalysis | null>(null)
  const [showStressAlert, setShowStressAlert] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [quickStressLevel, setQuickStressLevel] = useState(0)
  const [userStressHistory, setUserStressHistory] = useState<StressAnalysis[]>([])

  // Debounced stress analysis for real-time feedback
  const debouncedQuickAnalysis = useCallback(
    debounce(async (text: string) => {
      if (!text.trim()) {
        setQuickStressLevel(0)
        return
      }

      try {
        const analyzer = getStressAnalyzer()
        const quickCheck = analyzer.quickStressCheck(text)
        setQuickStressLevel(quickCheck.level)
      } catch (error) {
        console.error('Quick stress analysis failed:', error)
      }
    }, 500),
    []
  )

  // Full AI analysis when user stops typing for 2 seconds
  const debouncedFullAnalysis = useCallback(
    debounce(async (text: string, currentIntention: typeof intention) => {
      if (!text.trim() || text.length < 10) return

      setIsAnalyzing(true)
      // Clear previous analysis to avoid caching issues
      setStressAnalysis(null)
      
      try {
        const analyzer = getStressAnalyzer()
        const context: MessageContext = {
          text: text.trim(), // Trim whitespace
          intention: currentIntention,
          timestamp: new Date(),
          userHistory: userStressHistory.slice(-5) // Last 5 analyses for context
        }

        console.log('Analyzing message:', text.substring(0, 50) + '...') // Debug log
        const analysis = await analyzer.analyzeStress(context)
        console.log('Analysis result:', analysis) // Debug log
        setStressAnalysis(analysis)

        // Show alert for high stress
        if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
          setShowStressAlert(true)
        }
      } catch (error) {
        console.error('Full stress analysis failed:', error)
      } finally {
        setIsAnalyzing(false)
      }
    }, 2000),
    [userStressHistory]
  )

  useEffect(() => {
    debouncedQuickAnalysis(message)
    debouncedFullAnalysis(message, intention)
    
    return () => {
      debouncedQuickAnalysis.cancel()
      debouncedFullAnalysis.cancel()
    }
  }, [message, intention, debouncedQuickAnalysis, debouncedFullAnalysis])

  // Test function to verify AI is working - can be removed later
  const testAI = async () => {
    try {
      console.log('Testing AI with sample message...');
      const analyzer = getStressAnalyzer()
      const testMessage = "I'm gonna die from all this stress"
      const context: MessageContext = {
        text: testMessage,
        intention: null,
        timestamp: new Date(),
        userHistory: []
      }
      const result = await analyzer.analyzeStress(context)
      console.log('AI Test Result:', result)
    } catch (error) {
      console.error('AI Test Failed:', error)
    }
  }

  // Run test on component mount (remove this in production)
  useEffect(() => {
    testAI()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // Final stress check before sending
    if (stressAnalysis && stressAnalysis.riskLevel === 'critical') {
      setShowStressAlert(true)
      return
    }

    // Store stress analysis for user history
    if (stressAnalysis) {
      setUserStressHistory(prev => [...prev.slice(-9), stressAnalysis]) // Keep last 10
      
      // Save stress analysis to backend for Personal Dashboard
      try {
        await fetch('http://localhost:3003/api/stress-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userEmail: session?.user?.email,
            messageText: message,
            stressLevel: stressAnalysis.stressLevel,
            emotions: stressAnalysis.emotions,
            stressIndicators: stressAnalysis.stressIndicators,
            riskLevel: stressAnalysis.riskLevel,
            suggestions: stressAnalysis.suggestions,
            reason: stressAnalysis.reason,
            intention: intention,
            timestamp: new Date().toISOString()
          })
        })
      } catch (error) {
        console.error('Error saving stress analysis:', error)
      }
    }

    // Send the message
    onSendMessage(message, intention)
    
    // Reset form
    setMessage('')
    setIntention(null)
    setStressAnalysis(null)
    setQuickStressLevel(0)
  }

  const getStressColor = () => {
    if (quickStressLevel >= 8) return 'border-red-500'
    if (quickStressLevel >= 6) return 'border-orange-500'
    if (quickStressLevel >= 4) return 'border-yellow-500'
    return 'border-gray-300'
  }

  const getStressMeterColor = () => {
    if (quickStressLevel >= 8) return 'bg-red-500'
    if (quickStressLevel >= 6) return 'bg-orange-500'
    if (quickStressLevel >= 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const handleAcceptSuggestion = (suggestion: string) => {
    // You could implement specific actions for each suggestion
    console.log('User accepted suggestion:', suggestion)
    setShowStressAlert(false)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4">
        {/* Intention Selector */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Type (optional):
          </label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: null, label: '💬 General', color: 'bg-gray-100 text-gray-700' },
              { value: 'venting' as const, label: '😤 Venting', color: 'bg-orange-100 text-orange-700' },
              { value: 'advice' as const, label: '🤔 Need Advice', color: 'bg-blue-100 text-blue-700' },
              { value: 'urgent' as const, label: '🚨 Urgent Help', color: 'bg-red-100 text-red-700' }
            ].map(({ value, label, color }) => (
              <button
                key={label}
                type="button"
                onClick={() => setIntention(value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  intention === value 
                    ? color.replace('100', '200').replace('700', '800')
                    : color
                } hover:${color.replace('100', '200')}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Stress Meter */}
        {quickStressLevel > 3 && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Stress Level: {quickStressLevel}/10
              </span>
              {isAnalyzing && (
                <div className="flex items-center text-xs text-gray-500">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-1"></div>
                  Analyzing...
                </div>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getStressMeterColor()}`}
                style={{ width: `${(quickStressLevel / 10) * 100}%` }}
              />
            </div>
            {quickStressLevel >= 6 && (
              <p className="text-xs text-orange-600 mt-1">
                💡 Consider taking a moment before sending. Maybe rephrase more positively?
              </p>
            )}
          </div>
        )}

        {/* Message Input */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className={`w-full border-2 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900 placeholder-gray-500 bg-white shadow-sm ${getStressColor()}`}
              rows={3}
              maxLength={1000}
              style={{ 
                color: '#111827', 
                backgroundColor: '#ffffff',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-400">
                {message.length}/1000
              </span>
              {quickStressLevel > 0 && (
                <span className="text-xs text-gray-500">
                  Stress: {quickStressLevel}/10
                </span>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-lg transition duration-200 flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Checking...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </>
            )}
          </button>
        </div>

        {/* Quick Stress Tips */}
        {quickStressLevel >= 6 && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="font-medium text-blue-800 mb-1">💙 Quick Stress Relief:</p>
            <p className="text-blue-700">
              Try: Deep breathing (4-7-8 technique) • Step away for 2 minutes • Drink water • Stretch
            </p>
          </div>
        )}
      </form>

      {/* Stress Alert Modal */}
      {showStressAlert && stressAnalysis && (
        <StressAlert
          stressAnalysis={stressAnalysis}
          onClose={() => setShowStressAlert(false)}
          onAcceptSuggestion={handleAcceptSuggestion}
          onSendAnyway={stressAnalysis.riskLevel !== 'critical' ? () => {
            // For non-critical stress, allow sending to get human help
            onSendMessage(message, intention)
            setMessage('')
            setIntention(null)
            setStressAnalysis(null)
            setQuickStressLevel(0)
          } : undefined}
        />
      )}
    </>
  )
}