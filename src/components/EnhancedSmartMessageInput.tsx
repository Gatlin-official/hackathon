'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getEnhancedStressAnalyzer, EnhancedStressAnalysis, MessageContext } from '@/lib/enhanced-stress-analyzer'
import StressAlert from './StressAlert'
import AIConversationCoach from './AIConversationCoach'
import CrisisMode from './CrisisMode'
import { debounce } from 'lodash'

interface EnhancedSmartMessageInputProps {
  onSendMessage: (text: string, intention?: 'venting' | 'advice' | 'urgent' | null) => void
  groupId: string
  recentMessages?: string[]
  className?: string;
}

export default function EnhancedSmartMessageInput({ 
  onSendMessage, 
  groupId, 
  recentMessages = [],
  className = ''
}: EnhancedSmartMessageInputProps) {
  const { data: session } = useSession()
  const [message, setMessage] = useState('')
  const [intention, setIntention] = useState<'venting' | 'advice' | 'urgent' | null>(null)
  const [stressAnalysis, setStressAnalysis] = useState<EnhancedStressAnalysis | null>(null)
  const [showStressAlert, setShowStressAlert] = useState(false)
  const [showCrisisMode, setShowCrisisMode] = useState(false)
  const [showCoach, setShowCoach] = useState(false)
  const [mentorContacts, setMentorContacts] = useState<{ name: string; contact: string }[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [quickStressLevel, setQuickStressLevel] = useState(0)
  const [userStressHistory, setUserStressHistory] = useState<EnhancedStressAnalysis[]>([])
  const [stressPatternAlert, setStressPatternAlert] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Enhanced debounced stress analysis for real-time feedback
  const debouncedQuickAnalysis = useCallback(
    debounce(async (text: string) => {
      if (!text.trim()) {
        setQuickStressLevel(0)
        setShowCoach(false)
        return
      }

      try {
        // Basic crisis word detection
        const crisisWords = ['die', 'suicide', 'kill myself', 'end it all', 'not worth living']
        const hasCrisisWords = crisisWords.some(word => text.toLowerCase().includes(word))
        
        if (hasCrisisWords) {
          setQuickStressLevel(9)
          setShowCrisisMode(true)
          return
        }

        // Quick stress estimation
        let stressLevel = 2
        const stressKeywords = {
          high: ['overwhelmed', 'panic', 'crisis', 'breakdown', 'can\'t handle'],
          medium: ['stressed', 'anxious', 'worried', 'pressure', 'struggling'],
          mild: ['nervous', 'concerned', 'uneasy', 'tired']
        }

        Object.entries(stressKeywords).forEach(([level, words]) => {
          words.forEach(word => {
            if (text.toLowerCase().includes(word)) {
              switch(level) {
                case 'high': stressLevel += 3; break;
                case 'medium': stressLevel += 2; break;
                case 'mild': stressLevel += 1; break;
              }
            }
          })
        })

        const finalLevel = Math.min(10, stressLevel)
        setQuickStressLevel(finalLevel)
        
        // Show coach for moderate+ stress and sufficient text
        if (finalLevel >= 4 && text.length > 20) {
          setShowCoach(true)
        } else {
          setShowCoach(false)
        }

        // Check for stress patterns
        checkStressPatterns(finalLevel)
        
      } catch (error) {
        console.error('Quick stress analysis failed:', error)
      }
    }, 300),
    [userStressHistory]
  )

  // Enhanced full AI analysis
  const debouncedFullAnalysis = useCallback(
    debounce(async (text: string, currentIntention: typeof intention) => {
      if (!text.trim() || text.length < 10) return

      setIsAnalyzing(true)
      setStressAnalysis(null)

      try {
        const analyzer = getEnhancedStressAnalyzer()
        
        const context: MessageContext = {
          text: text.trim(),
          intention: currentIntention,
          timestamp: new Date(),
          userHistory: userStressHistory.slice(-10), // Last 10 analyses for context
          conversationContext: recentMessages.slice(-5), // Recent conversation
        }

        console.log('🧠 Starting enhanced stress analysis...', {
          textLength: text.length,
          intention: currentIntention,
          historyCount: userStressHistory.length
        })

        const analysis = await analyzer.analyzeStress(context)
        
        console.log('✅ Enhanced analysis completed:', {
          stressLevel: analysis.stressLevel,
          mood: analysis.moodType,
          crisis: analysis.crisisIndicators,
          confidence: analysis.emotionConfidence
        })

        setStressAnalysis(analysis)

        // Crisis mode activation
        if (analysis.crisisIndicators || analysis.stressLevel >= 8) {
          setShowCrisisMode(true)
        }

        // Show stress alert for high stress (but not crisis)
        if (analysis.stressLevel >= 6 && !analysis.crisisIndicators) {
          setShowStressAlert(true)
        }

        // Store analysis in user history
        setUserStressHistory(prev => {
          const updated = [...prev, analysis]
          return updated.slice(-20) // Keep last 20 analyses
        })

        // Save to Firebase/local storage for persistence
        await saveAnalysisToHistory(analysis)

      } catch (error) {
        console.error('❌ Enhanced stress analysis failed:', error)
        
        // Fallback to basic analysis
        const fallbackAnalysis: EnhancedStressAnalysis = {
          stressLevel: quickStressLevel,
          moodType: quickStressLevel >= 6 ? 'Stressed' : 'Calm',
          intentType: currentIntention === 'urgent' ? 'Seeking Help' : 'Casual Chat',
          confidence: 40,
          summary: 'Basic analysis (AI unavailable)',
          suggestedAction: 'Continue conversation or seek support if needed',
          emotionConfidence: 40,
          stressPatterns: [],
          crisisIndicators: quickStressLevel >= 8,
          supportLevel: quickStressLevel >= 6 ? 'peer' : 'none',
          conversationTone: quickStressLevel >= 6 ? 'concerned' : 'neutral',
          wellnessActivities: [],
          stressIndicators: [],
          emotions: [],
          suggestions: [],
          riskLevel: quickStressLevel >= 6 ? 'high' : 'low'
        }
        
        setStressAnalysis(fallbackAnalysis)
      } finally {
        setIsAnalyzing(false)
      }
    }, 2000),
    [quickStressLevel, userStressHistory, recentMessages]
  )

  // Check for concerning stress patterns
  const checkStressPatterns = (currentLevel: number) => {
    if (userStressHistory.length >= 3) {
      const recentHighStress = userStressHistory.slice(-3).filter(h => h.stressLevel >= 6)
      if (recentHighStress.length >= 2 && currentLevel >= 6) {
        setStressPatternAlert(true)
      }
    }
  }

  // Save analysis to persistent storage
  const saveAnalysisToHistory = async (analysis: EnhancedStressAnalysis) => {
    try {
      // Save to localStorage as backup
      const historyKey = `stress_history_${session?.user?.email || 'anonymous'}`
      const existing = JSON.parse(localStorage.getItem(historyKey) || '[]')
      const updated = [...existing, { 
        ...analysis, 
        timestamp: new Date().toISOString(),
        groupId 
      }].slice(-50) // Keep last 50
      
      localStorage.setItem(historyKey, JSON.stringify(updated))
      
      // TODO: Also save to Firebase for cross-device sync
      
    } catch (error) {
      console.error('Failed to save analysis history:', error)
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [message])

  // Trigger analyses when message changes
  useEffect(() => {
    debouncedQuickAnalysis(message)
    debouncedFullAnalysis(message, intention)
  }, [message, intention, debouncedQuickAnalysis, debouncedFullAnalysis])

  // Load user stress history on mount
  useEffect(() => {
    const loadStressHistory = () => {
      try {
        const historyKey = `stress_history_${session?.user?.email || 'anonymous'}`
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
        const recentHistory = history
          .slice(-10)
          .map((h: any) => ({
            ...h,
            timestamp: new Date(h.timestamp)
          }))
        setUserStressHistory(recentHistory)
      } catch (error) {
        console.error('Failed to load stress history:', error)
      }
    }

    const loadMentorContacts = () => {
      try {
        const contactsKey = `mentorContacts_${session?.user?.email || 'anonymous'}`
        const contacts = JSON.parse(localStorage.getItem(contactsKey) || '[]')
        setMentorContacts(contacts)
      } catch (error) {
        console.error('Failed to load mentor contacts:', error)
      }
    }

    if (session) {
      loadStressHistory()
      loadMentorContacts()
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) return

    // Send message with current analysis
    onSendMessage(message.trim(), intention)
    
    // Clear form
    setMessage('')
    setIntention(null)
    setShowStressAlert(false)
    setShowCoach(false)
    setQuickStressLevel(0)
  }

  const handleCoachSuggestion = (suggestion: string) => {
    setMessage(suggestion)
    setShowCoach(false)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }

  const handleCrisisDismiss = () => {
    setShowCrisisMode(false)
  }

  const handleCrisisHelp = () => {
    // Could navigate to resources page or show additional help
    setShowCrisisMode(false)
    // Show additional support resources
    setShowStressAlert(true)
  }

  const getStressColor = (level: number) => {
    if (level >= 8) return 'border-red-500 bg-red-50'
    if (level >= 6) return 'border-orange-500 bg-orange-50'
    if (level >= 4) return 'border-yellow-500 bg-yellow-50'
    if (level >= 2) return 'border-blue-500 bg-blue-50'
    return 'border-gray-300 bg-white'
  }

  const getStressIndicator = () => {
    if (quickStressLevel >= 8) return { color: 'text-red-600', text: 'Crisis level detected', icon: '🚨', urgent: true }
    if (quickStressLevel >= 6) return { color: 'text-red-600', text: 'High stress detected', icon: '🔴', urgent: true }
    if (quickStressLevel >= 4) return { color: 'text-yellow-600', text: 'Moderate stress', icon: '🟡', urgent: false }
    if (quickStressLevel >= 2) return { color: 'text-blue-600', text: 'Mild stress', icon: '🔵', urgent: false }
    return null
  }

  const stressIndicator = getStressIndicator()

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Crisis Mode Modal */}
      {showCrisisMode && stressAnalysis && (
        <CrisisMode
          analysis={stressAnalysis}
          onDismiss={handleCrisisDismiss}
          onGetHelp={handleCrisisHelp}
          mentorContacts={mentorContacts}
        />
      )}

      {/* Stress Pattern Alert */}
      {stressPatternAlert && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-orange-600 text-xl">⚠️</span>
            <h3 className="text-orange-800 font-semibold">Stress Pattern Alert</h3>
          </div>
          <p className="text-orange-700 text-sm mb-3">
            We've noticed you've been experiencing elevated stress levels recently. 
            Consider taking a break or reaching out for support.
          </p>
          <button
            onClick={() => setStressPatternAlert(false)}
            className="text-orange-600 hover:text-orange-800 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* AI Conversation Coach */}
      {showCoach && (
        <AIConversationCoach
          currentMessage={message}
          recentMessages={recentMessages}
          onSuggestionAccept={handleCoachSuggestion}
          className="mb-4"
        />
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Message Input */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share what's on your mind..."
            rows={3}
            className={`w-full p-4 border rounded-lg resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStressColor(quickStressLevel)}`}
            style={{
              color: '#111827',
              backgroundColor: quickStressLevel >= 6 ? '#fef2f2' : '#ffffff',
              minHeight: '80px',
              maxHeight: '200px'
            }}
          />
          
          {/* Real-time stress indicator */}
          {stressIndicator && (
            <div className={`absolute top-2 right-2 flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              stressIndicator.urgent ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <span>{stressIndicator.icon}</span>
              <span className={stressIndicator.color}>{stressIndicator.text}</span>
            </div>
          )}
          
          {/* Analysis loading indicator */}
          {isAnalyzing && (
            <div className="absolute bottom-2 right-2 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-xs text-gray-600">Analyzing...</span>
            </div>
          )}
        </div>

        {/* Intention Selection */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: null, label: 'General', icon: '💬' },
            { value: 'venting', label: 'Venting', icon: '😤' },
            { value: 'advice', label: 'Seeking Advice', icon: '🤔' },
            { value: 'urgent', label: 'Need Help', icon: '🆘' }
          ].map(({ value, label, icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => setIntention(value as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                intention === value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {stressAnalysis && (
              <div className="text-xs text-gray-600">
                AI Confidence: {stressAnalysis.emotionConfidence}%
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || showCrisisMode}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send Message
          </button>
        </div>
      </form>

      {/* Stress Alert Component */}
      {showStressAlert && stressAnalysis && (
        <StressAlert
          stressAnalysis={stressAnalysis}
          onClose={() => setShowStressAlert(false)}
          onAcceptSuggestion={(suggestion) => {
            setMessage(suggestion);
            textareaRef.current?.focus();
          }}
        />
      )}
    </div>
  )
}