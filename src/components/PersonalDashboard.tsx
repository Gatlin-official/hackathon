'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getCurrentUsername } from '@/utils/username'
import { useStressNotifications, requestNotificationPermission } from '@/hooks/useStressNotifications'
// import StressNotificationsPanel from './StressNotificationsPanel' // Temporarily disabled
import CalendarIntegration from './CalendarIntegration'
import { 
  intelligentWellnessBot, 
  ConversationContext, 
  ChatMessage as WellnessChatMessage,
  WellnessResponse 
} from '@/lib/intelligent-wellness-bot'

interface DashboardStats {
  totalMessages: number
  stressLevel: number
  weeklyTrend: number
  peakStressTime: string
  avgResponseTime: string
  activeGroups: number
  currentMood: string
  moodEmoji: string
  confidence: number
}

interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  stressLevel?: number
  emotion?: string
  emotions?: string[]
  aiResponse?: WellnessResponse
  aiAnalysis?: {
    emotionalState: string
    supportType: 'validation' | 'advice' | 'crisis' | 'celebration'
    responseStrategy: string
  }
}

interface MoodInsight {
  message: string
  emotion: string
  stressScore: number
  intent: string
}

interface PersonalDashboardProps {
  onClose: () => void
}

export default function PersonalDashboard({ onClose }: PersonalDashboardProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'overview' | 'wellness' | 'insights' | 'notifications'>('overview')
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    stressLevel: 3.2,
    weeklyTrend: -12,
    peakStressTime: '14:30',
    avgResponseTime: '2min',
    activeGroups: 3,
    currentMood: 'Calm',
    moodEmoji: '🌤️',
    confidence: 85
  })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    messageHistory: [],
    userProfile: {
      name: session?.user?.name || undefined,
      email: session?.user?.email || undefined,
      preferredTone: 'empathetic'
    },
    sessionData: {
      totalMessages: 0,
      highStressCount: 0,
      conversationThemes: []
    }
  })
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Stress notifications system
  const stressNotifications = useStressNotifications(session?.user?.email || 'anonymous')

  // Update time every minute for dynamic greeting
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  // AI Chat functionality - Enhanced Stress Level Analysis
  const analyzeStressLevel = (text: string): number => {
    const stressKeywords = {
      high: ['stressed', 'anxious', 'overwhelmed', 'panic', 'exhausted', 'burnout', 'pressure', 'deadline', 'worried', 'depressed', 'crying', 'help', 'fear', 'scared', 'terrified', 'nervous', 'exam', 'test', 'fever', 'sick', 'illness'],
      medium: ['tired', 'busy', 'concerned', 'frustrated', 'confused', 'uncertain', 'difficult', 'annoyed', 'upset', 'think', 'anyone', 'like me', 'feeling', 'because'],
      low: ['calm', 'good', 'fine', 'okay', 'relaxed', 'peaceful', 'content', 'happy', 'great', 'awesome', 'excellent', 'wonderful']
    }
    
    const words = text.toLowerCase().split(' ')
    let stressScore = 5 // neutral baseline
    
    words.forEach(word => {
      if (stressKeywords.high.some(keyword => word.includes(keyword))) {
        stressScore += 2
      } else if (stressKeywords.medium.some(keyword => word.includes(keyword))) {
        stressScore += 1
      } else if (stressKeywords.low.some(keyword => word.includes(keyword))) {
        stressScore -= 1
      }
    })
    
    return Math.max(1, Math.min(10, stressScore))
  }

  // Generate AI advice based on stress level
  const generateAIAdvice = (stressLevel: number): string => {
    if (stressLevel >= 7) {
      return "I can see you're feeling quite stressed. Try taking deep breaths: inhale for 4 counts, hold for 4, exhale for 6. Consider taking a short break or talking to someone you trust."
    } else if (stressLevel >= 5) {
      return "You seem to be experiencing some stress. Try a 5-minute walk, listen to calming music, or practice gentle stretches to help you relax."
    } else {
      return "You're doing well! Keep maintaining healthy habits like regular breaks, staying hydrated, and practicing mindfulness to stay balanced."
    }
  }

  // Handle sending messages with intelligent wellness bot
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return
    
    const stressLevel = analyzeStressLevel(inputMessage)
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
      stressLevel
    }
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)
    
    // Update stats
    setStats(prev => ({
      ...prev,
      stressLevel,
      totalMessages: prev.totalMessages + 1
    }))
    
    try {
      // Get intelligent AI response using API endpoint
      console.log('🤖 Getting intelligent wellness response via API...')
      const apiResponse = await fetch('/api/wellness-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationHistory: conversationContext.messageHistory,
          userProfile: conversationContext.userProfile
        })
      })
      
      const data = await apiResponse.json()
      console.log('🤖 API Response:', data)
      
      if (!data.success) {
        throw new Error('API request failed')
      }
      
      const wellnessResponse = data.response
      
      // Update conversation context
      const updatedContext = intelligentWellnessBot.updateContext(userMessage, conversationContext)
      setConversationContext(updatedContext)
      
      // Create AI response message
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: wellnessResponse.message,
          isUser: false,
          timestamp: new Date(),
          aiResponse: wellnessResponse
        }
        
        setMessages(prev => [...prev, aiMessage])
        setIsTyping(false)
        
        // Add detailed wellness notification if stress detected
        if (stressLevel >= 5 || wellnessResponse.crisisLevel !== 'none') {
          const urgencyLevel = wellnessResponse.crisisLevel === 'severe' ? 'urgent' : 
                              wellnessResponse.crisisLevel === 'moderate' ? 'attention' : 'normal'
          
          // Generate personalized AI remedies based on the message content and stress analysis
          const personalizedRemedies = [
            `Your stress score: ${stressLevel}/10 - ${wellnessResponse.crisisLevel !== 'none' ? 'Elevated stress detected' : 'Mild stress noted'}`,
            wellnessResponse.message.split('.')[0] || 'Take a moment to breathe deeply',
            ...wellnessResponse.followUpSuggestions?.slice(0, 2) || ['Practice 4-7-8 breathing', 'Take a 5-minute break'],
            ...wellnessResponse.therapeuticTechniques?.slice(0, 2) || ['Try progressive muscle relaxation', 'Use the grounding technique: 5 things you see, 4 you hear, 3 you touch']
          ]
          
          stressNotifications.addNotification({
            userId: session?.user?.email || 'anonymous',
            message: `🔍 AI Stress Analysis: Detected ${stressLevel}/10 stress level in your message about "${inputMessage.substring(0, 50)}..." - Here's your personalized wellness plan.`,
            stressScore: stressLevel,
            stressLevel: stressLevel >= 8 ? 'severe' : stressLevel >= 6 ? 'high' : stressLevel >= 4 ? 'moderate' : 'low',
            remedies: personalizedRemedies,
            originalMessage: inputMessage,
            emotions: wellnessResponse.emotion ? [wellnessResponse.emotion] : ['concern', 'awareness'],
            urgency: urgencyLevel
          })
        }
        
        // Show crisis resources if needed
        if (wellnessResponse.crisisLevel === 'severe') {
          setTimeout(() => {
            const crisisResources = intelligentWellnessBot.getCrisisResources()
            const crisisMessage: ChatMessage = {
              id: (Date.now() + 2).toString(),
              text: `🆘 **Crisis Support Resources:**\n\n${crisisResources.join('\n')}\n\n💙 You're not alone. Please reach out for help.`,
              isUser: false,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, crisisMessage])
          }, 1000)
        }
      }, 1000 + Math.random() * 1000) // Variable response time for natural feel
      
    } catch (error) {
      console.error('Error getting wellness response:', error)
      
      // Enhanced fallback using API endpoint 
      try {
        const fallbackResponse = await fetch('/api/wellness-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: inputMessage,
            conversationHistory: [],
            userProfile: { name: session?.user?.name }
          })
        })
        
        const fallbackData = await fallbackResponse.json()
        
        setTimeout(() => {
          const fallbackMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: fallbackData.response?.message || "I'm here to listen and support you. 💙",
            isUser: false,
            timestamp: new Date(),
            aiResponse: fallbackData.response
          }
          setMessages(prev => [...prev, fallbackMessage])
          setIsTyping(false)
        }, 1000)
      } catch (fallbackError) {
        // Final fallback
        setTimeout(() => {
          const finalFallback: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: "I'm here to listen and support you. 💙 Could you share a bit more about how you're feeling?",
            isUser: false,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, finalFallback])
          setIsTyping(false)
        }, 1000)
      }
    }
  }

  // Get dynamic greeting and quote
  const getGreeting = () => {
    const hour = currentTime.getHours()
    const name = session?.user?.name || 'Dear friend'
    if (hour < 12) return `Good morning, ${name}! 🌅`
    if (hour < 17) return `Good afternoon, ${name}! 🌞`
    return `Good evening, ${name}! 🌙`
  }

  const getQuote = () => {
    const quotes = [
      "It's okay to pause and breathe 🌿",
      "You're doing better than you think 🌸",
      "Every small step counts 🦋",
      "Be gentle with yourself today 🌺",
      "Progress, not perfection 🍃"
    ]
    return quotes[Math.floor(Math.random() * quotes.length)]
  }

  // Get wellness suggestions based on current mood
  const getWellnessTip = () => {
    if (stats.stressLevel > 7) return "Try a 5-minute breathing exercise 🌬️"
    if (stats.stressLevel > 4) return "Take a gentle walk outside 🚶‍♀️"
    return "Keep up the great work! Stay hydrated 💧"
  }

  const tabs = [
    { id: 'overview', label: 'Mood Garden', icon: '🌸', desc: 'Your emotional landscape' },
    { id: 'wellness', label: 'Wellness Corner', icon: '🌿', desc: 'Care & support' },
    { id: 'insights', label: 'Gentle Insights', icon: '✨', desc: 'Understanding patterns' },
    { 
      id: 'notifications', 
      label: 'Wellness Alerts', 
      icon: stressNotifications.unreadCount > 0 ? '🔔' : '🔕', 
      desc: stressNotifications.unreadCount > 0 ? `${stressNotifications.unreadCount} new` : 'All clear' 
    }
  ]

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[95vh] flex flex-col shadow-xl border border-gray-200">
        {/* Clean Header */}
        <div className="relative bg-white border-b border-gray-200 p-6 rounded-t-lg">
          <div className="flex items-center justify-between text-gray-800">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}</h1>
              <p className="text-gray-600">{currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <div className="flex items-center gap-3 text-lg">
                <span className="text-gray-700">Mood:</span>
                <span className="text-xl">{stats.moodEmoji}</span>
                <span className="font-medium text-gray-800">{stats.currentMood}</span>
              </div>
            </div>
            <div className="text-right space-y-2">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl hover:rotate-90 transition-all duration-300 bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
              <div className="text-sm text-gray-500">
                <div>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-50 border-b border-gray-200">
          <nav className="flex justify-center gap-2 px-8 py-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group relative flex flex-col items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 rounded-t-lg ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-white shadow-md border-t-2 border-x border-gray-200 border-t-blue-500'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <div className="text-center">
                  <div className="font-semibold">{tab.label}</div>
                  <div className="text-xs opacity-70">{tab.desc}</div>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-500"></div>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Areas */}
        <div className="flex-1 overflow-hidden bg-white">
          {activeTab === 'overview' && (
            <div className="p-8 h-full overflow-y-auto space-y-6">
              {/* Mood Summary Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-emerald-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    🌸 Today's Emotional Garden
                  </h3>
                  <div className="text-sm text-gray-500">Confidence: {stats.confidence}%</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Mood Status */}
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                    <div className="text-4xl mb-2">{stats.moodEmoji}</div>
                    <h4 className="font-semibold text-gray-800">Mood: {stats.currentMood}</h4>
                    <p className="text-sm text-gray-600 mt-1">You seemed a bit overwhelmed today</p>
                  </div>
                  
                  {/* Stress Gauge */}
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="transparent"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={stats.stressLevel <= 3 ? 'text-green-400' : stats.stressLevel <= 6 ? 'text-yellow-400' : 'text-red-400'}
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          fill="transparent"
                          strokeDasharray={`${stats.stressLevel * 10}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                        {stats.stressLevel}
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-800">Stress Level</h4>
                    <p className="text-sm text-gray-600">Out of 10</p>
                  </div>
                  
                  {/* AI Summary */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                    <div className="text-2xl mb-2 text-center">🔮</div>
                    <h4 className="font-semibold text-gray-800 text-center mb-2">AI Insight</h4>
                    <p className="text-sm text-gray-600 text-center">
                      "You've mentioned deadlines often — maybe take a break soon."
                    </p>
                  </div>
                </div>
              </div>

              {/* Mood Trend & Wellness Assistant */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mood Trend Graph */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    📈 Mood Journey (Last 7 Days)
                  </h3>
                  <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📊</div>
                      <p>Trend visualization</p>
                      <p className="text-sm">Highest stress on Thursday</p>
                      <div className="mt-2 text-emerald-600 font-medium">
                        {stats.weeklyTrend > 0 ? '+' : ''}{stats.weeklyTrend}% this week
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Wellness Assistant */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-green-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    🧘 Wellness Assistant
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl">
                      <h4 className="font-medium text-gray-800 flex items-center gap-2 mb-2">
                        💡 Daily Tip
                      </h4>
                      <p className="text-sm text-gray-600">{getWellnessTip()}</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
                      <h4 className="font-medium text-gray-800 flex items-center gap-2 mb-2">
                        🎧 Suggestion
                      </h4>
                      <p className="text-sm text-gray-600">Play relaxing Lo-Fi music?</p>
                      <button className="mt-2 px-3 py-1 bg-indigo-100 hover:bg-indigo-200 rounded-full text-sm transition-colors">
                        Try it 🎵
                      </button>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                      <h4 className="font-medium text-gray-800 flex items-center gap-2 mb-2">
                        🫶 Mindful Action
                      </h4>
                      <p className="text-sm text-gray-600">Try 3-min mindfulness activity</p>
                      <button className="mt-2 px-3 py-1 bg-emerald-100 hover:bg-emerald-200 rounded-full text-sm transition-colors">
                        Start now 🌿
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Insights */}
              {messages.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-purple-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    💬 Recent Reflections
                  </h3>
                  <div className="space-y-3">
                    {messages.filter(m => m.isUser).slice(-3).map((message) => (
                      <div key={message.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 truncate">"{message.text.substring(0, 50)}..."</p>
                          <p className="text-xs text-gray-500">
                            {message.emotion || 'Thoughtful'} • Intent: {message.stressLevel! > 7 ? 'Venting' : message.stressLevel! > 4 ? 'Sharing' : 'Reflecting'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg ${message.stressLevel! <= 3 ? 'text-green-500' : message.stressLevel! <= 6 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {message.stressLevel! <= 3 ? '😌' : message.stressLevel! <= 6 ? '😐' : '😰'}
                          </div>
                          <div className="text-xs text-gray-500">{message.stressLevel}/10</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 w-full py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                    View all reflections →
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'wellness' && (
            <div className="flex flex-col h-full">
              {/* Enhanced Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      🧘‍♀️ Zen - Intelligent Wellness Assistant
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">AI Powered</span>
                    </h3>
                    <p className="text-sm text-blue-100 mt-1">
                      Emotionally intelligent • Crisis-aware • Always here for you
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-blue-100">Session Stats</div>
                    <div className="flex items-center gap-3 text-sm mt-1">
                      <div className="flex items-center gap-1">
                        <span>Stress:</span>
                        <span className={`font-bold px-2 py-1 rounded-full text-xs ${
                          stats.stressLevel <= 3 ? 'bg-green-500' : 
                          stats.stressLevel <= 6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}>
                          {stats.stressLevel}/10
                        </span>
                      </div>
                      <div className="text-blue-100">
                        {stats.totalMessages} messages
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Conversation themes */}
                {conversationContext.sessionData.conversationThemes.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-blue-200">Topics:</span>
                    <div className="flex gap-1">
                      {conversationContext.sessionData.conversationThemes.map((theme, idx) => (
                        <span key={idx} className="text-xs bg-white/10 px-2 py-1 rounded-full text-blue-100">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8 text-gray-500 space-y-4">
                    <div className="text-6xl mb-4">�‍♀️</div>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-3xl border border-blue-100">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        Hello {session?.user?.name || 'friend'}! I'm Zen 💙
                      </h4>
                      <p className="text-gray-600 mb-3">
                        Your personal AI wellness companion, here to listen, understand, and support you through anything you're experiencing.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                          <div className="text-blue-600 font-medium">🤗 I'm here to listen</div>
                          <div className="text-gray-600 mt-1">Share your thoughts, feelings, or concerns</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-purple-100">
                          <div className="text-purple-600 font-medium">🧠 I understand emotions</div>
                          <div className="text-gray-600 mt-1">I can sense your stress and provide support</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-green-100">
                          <div className="text-green-600 font-medium">💡 I offer guidance</div>
                          <div className="text-gray-600 mt-1">Personalized coping strategies and techniques</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-red-100">
                          <div className="text-red-600 font-medium">🆘 Crisis support</div>
                          <div className="text-gray-600 mt-1">Immediate help when you need it most</div>
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        💭 Try starting with: "How are you feeling today?" or "I'm stressed about..."
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className={`flex w-full ${message.isUser ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-md px-4 py-3 rounded-2xl ${
                      message.isUser 
                        ? 'bg-blue-500 text-white rounded-bl-md' 
                        : `bg-gray-100 text-gray-800 rounded-br-md ${
                            message.aiResponse?.crisisLevel === 'severe' ? 'border-l-4 border-red-500' :
                            message.aiResponse?.crisisLevel === 'moderate' ? 'border-l-4 border-yellow-500' :
                            'border-l-4 border-green-500'
                          }`
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                      
                      {/* User message stress indicator */}
                      {message.isUser && message.stressLevel && (
                        <div className="mt-2 text-xs opacity-80">
                          Stress: {message.stressLevel}/10
                          <span className="ml-1">
                            {message.stressLevel <= 3 ? '😌' : message.stressLevel <= 6 ? '😐' : '😰'}
                          </span>
                        </div>
                      )}

                      {/* AI response enhancements */}
                      {!message.isUser && message.aiResponse && (
                        <div className="mt-3 space-y-2">
                          {/* Follow-up suggestions */}
                          {message.aiResponse.followUpSuggestions && message.aiResponse.followUpSuggestions.length > 0 && (
                            <div className="bg-blue-50 p-2 rounded-lg">
                              <div className="text-xs font-medium text-blue-800 mb-1">💭 Gentle suggestions:</div>
                              {message.aiResponse.followUpSuggestions.map((suggestion, idx) => (
                                <div key={idx} className="text-xs text-blue-700">• {suggestion}</div>
                              ))}
                            </div>
                          )}

                          {/* Therapeutic techniques */}
                          {message.aiResponse.therapeuticTechniques && message.aiResponse.therapeuticTechniques.length > 0 && (
                            <div className="bg-green-50 p-2 rounded-lg">
                              <div className="text-xs font-medium text-green-800 mb-1">🧘 Helpful techniques:</div>
                              {message.aiResponse.therapeuticTechniques.map((technique, idx) => (
                                <div key={idx} className="text-xs text-green-700">• {technique}</div>
                              ))}
                            </div>
                          )}

                          {/* Calendar Integration - NEW FEATURE! */}
                          {message.aiResponse.calendarSuggestion && message.aiResponse.calendarSuggestion.needed && (
                            <CalendarIntegration 
                              calendarSuggestion={message.aiResponse.calendarSuggestion}
                              onCalendarCreated={(success, eventCount) => {
                                if (success) {
                                  // Add a follow-up message from Zen
                                  const followUpMessage: ChatMessage = {
                                    id: Date.now().toString() + '_calendar_success',
                                    text: `🎉 Perfect! I've added ${eventCount} events to your Google Calendar. Your personalized schedule is ready to help you manage stress and stay organized. Remember, you can always adjust these times to fit your needs better!`,
                                    isUser: false,
                                    timestamp: new Date()
                                  }
                                  setMessages(prev => [...prev, followUpMessage])
                                } else {
                                  const errorMessage: ChatMessage = {
                                    id: Date.now().toString() + '_calendar_error',
                                    text: `😊 No worries! Even without adding to your calendar, you can still follow the schedule I suggested. Screenshot it or write it down - the important thing is having a plan that works for you!`,
                                    isUser: false,
                                    timestamp: new Date()
                                  }
                                  setMessages(prev => [...prev, errorMessage])
                                }
                              }}
                              className="mt-2"
                            />
                          )}

                          {/* Crisis level indicator */}
                          {message.aiResponse.crisisLevel !== 'none' && (
                            <div className={`text-xs px-2 py-1 rounded-full text-center ${
                              message.aiResponse.crisisLevel === 'severe' ? 'bg-red-100 text-red-800' :
                              message.aiResponse.crisisLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {message.aiResponse.crisisLevel === 'severe' ? '🚨 High priority support' :
                               message.aiResponse.crisisLevel === 'moderate' ? '⚠️ Care needed' :
                               '✅ Supportive check-in'}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-3 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Input Area */}
              <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                {/* Quick suggestions (shown when no messages) */}
                {messages.length === 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-600 mb-2">Quick starters:</div>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        "I'm feeling stressed about...",
                        "I'm having a hard time with...",
                        "I'm excited because...",
                        "I need help with...",
                        "Can you help me understand..."
                      ].map((starter, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInputMessage(starter)}
                          className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          {starter}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder={messages.length === 0 
                      ? "Hi Zen! How are you feeling today? I'm here to listen..." 
                      : "Continue sharing your thoughts..."}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
                    disabled={isTyping}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                  >
                    {isTyping ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Thinking...</span>
                      </>
                    ) : (
                      <>
                        <span>Send</span>
                        <span>💙</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-2 text-xs text-gray-500 text-center">
                  💙 Zen is powered by AI and designed to support your mental wellness
                </div>
              </div>
            </div>
          )}



          {activeTab === 'insights' && (
            <div className="p-8 h-full overflow-y-auto space-y-6">
              {/* Insights Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-3">
                  🔮 Gentle Insights
                </h3>
                <p className="text-gray-600 mt-2">Understanding your emotional patterns with kindness</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AI Reflection Journal */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-indigo-100">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    📝 AI Reflection Journal
                  </h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🌟</div>
                        <div>
                          <h5 className="font-medium text-gray-800">Today's Theme</h5>
                          <p className="text-sm text-gray-600 mt-1">
                            "You've shown remarkable resilience in handling your workload. Your messages reveal someone who cares deeply about quality."
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">💡</div>
                        <div>
                          <h5 className="font-medium text-gray-800">Pattern Recognition</h5>
                          <p className="text-sm text-gray-600 mt-1">
                            "Stress peaks around 2 PM when discussing deadlines. Consider scheduling breaks during this time."
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🌱</div>
                        <div>
                          <h5 className="font-medium text-gray-800">Growth Opportunity</h5>
                          <p className="text-sm text-gray-600 mt-1">
                            "You're developing stronger coping strategies. Your recent messages show increased self-awareness."
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emotional Trends */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-pink-100">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    📊 Emotional Weather Map
                  </h4>
                  <div className="space-y-6">
                    {/* Weekly Overview */}
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl">
                      <h5 className="font-medium text-gray-800 mb-3">This Week's Weather</h5>
                      <div className="grid grid-cols-7 gap-2 text-center">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                          <div key={day} className="p-2">
                            <div className="text-xs text-gray-600">{day}</div>
                            <div className="text-lg">
                              {index === 3 ? '⛈️' : index === 5 ? '🌈' : index === 6 ? '☀️' : '🌤️'}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        Mostly sunny with a storm on Thursday
                      </p>
                    </div>

                    {/* Emotional Categories */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                        <span className="text-sm font-medium">😌 Calm & Peaceful</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-400 h-2 rounded-full" style={{width: '75%'}}></div>
                          </div>
                          <span className="text-xs text-gray-600">75%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                        <span className="text-sm font-medium">😰 Stressed & Anxious</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-400 h-2 rounded-full" style={{width: '25%'}}></div>
                          </div>
                          <span className="text-xs text-gray-600">25%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                        <span className="text-sm font-medium">😊 Happy & Excited</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-400 h-2 rounded-full" style={{width: '60%'}}></div>
                          </div>
                          <span className="text-xs text-gray-600">60%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Peer Support & Learning */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Anonymous Peer Insights */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-teal-100">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    🤝 Community Wisdom
                  </h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl">
                      <p className="text-sm text-gray-700 italic mb-2">
                        "Taking micro-breaks every hour really helped me manage my stress during finals week."
                      </p>
                      <p className="text-xs text-gray-500">— Fellow student with similar patterns</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                      <p className="text-sm text-gray-700 italic mb-2">
                        "I found that talking about my worries out loud, even to an AI, made them feel more manageable."
                      </p>
                      <p className="text-xs text-gray-500">— Someone who overcame similar challenges</p>
                    </div>
                  </div>
                  <button className="mt-4 w-full py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-xl transition-colors">
                    Share your wisdom anonymously →
                  </button>
                </div>

                {/* Learning Resources */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-rose-100">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    📚 Personalized Learning
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl">
                      <h5 className="font-medium text-gray-800 text-sm mb-1">Stress Management 101</h5>
                      <p className="text-xs text-gray-600 mb-2">Based on your patterns</p>
                      <div className="flex items-center gap-2">
                        <div className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full">5 min read</div>
                        <button className="text-xs text-rose-600 hover:underline">Start reading →</button>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                      <h5 className="font-medium text-gray-800 text-sm mb-1">Mindful Communication</h5>
                      <p className="text-xs text-gray-600 mb-2">Expressing feelings effectively</p>
                      <div className="flex items-center gap-2">
                        <div className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Interactive</div>
                        <button className="text-xs text-indigo-600 hover:underline">Try exercise →</button>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl">
                      <h5 className="font-medium text-gray-800 text-sm mb-1">Building Resilience</h5>
                      <p className="text-xs text-gray-600 mb-2">Your journey to emotional strength</p>
                      <div className="flex items-center gap-2">
                        <div className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Video guide</div>
                        <button className="text-xs text-emerald-600 hover:underline">Watch now →</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-8 h-full overflow-y-auto">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">🧠 AI Wellness Alerts</h3>
                  {stressNotifications.unreadCount > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {stressNotifications.unreadCount} new
                      </span>
                      <button 
                        onClick={stressNotifications.markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {stressNotifications.notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🌟</div>
                      <p className="text-lg font-medium">No wellness alerts right now</p>
                      <p className="text-sm">Keep taking care of yourself!</p>
                      <p className="text-xs text-green-600 mt-2">✅ AI monitoring system is active</p>
                    </div>
                  ) : (
                    stressNotifications.notifications.map((notification) => {
                      const getStressColor = (score: number) => {
                        if (score >= 8) return 'border-red-500 bg-red-50'
                        if (score >= 6) return 'border-orange-500 bg-orange-50'
                        if (score >= 4) return 'border-yellow-500 bg-yellow-50'
                        return 'border-green-500 bg-green-50'
                      }

                      const getStressIcon = (score: number) => {
                        if (score >= 8) return '🚨'
                        if (score >= 6) return '⚠️'
                        if (score >= 4) return '💭'
                        return '💙'
                      }

                      return (
                        <div
                          key={notification.id}
                          className={`border-l-4 p-4 rounded-lg ${getStressColor(notification.stressScore)} ${
                            notification.isRead ? 'opacity-70' : 'shadow-md'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="text-2xl">
                                {getStressIcon(notification.stressScore)}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-gray-800">
                                    AI Stress Analysis
                                  </span>
                                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                                    Score: {notification.stressScore}/10
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    notification.stressLevel === 'severe' ? 'bg-red-200 text-red-800' :
                                    notification.stressLevel === 'high' ? 'bg-orange-200 text-orange-800' :
                                    notification.stressLevel === 'moderate' ? 'bg-yellow-200 text-yellow-800' :
                                    'bg-green-200 text-green-800'
                                  }`}>
                                    {notification.stressLevel.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-gray-700 mb-3">
                                  {notification.message}
                                </p>
                                
                                <div className="bg-white p-3 rounded-lg border border-gray-200 mb-3">
                                  <h5 className="text-xs font-semibold text-gray-800 mb-2">📝 Original Message:</h5>
                                  <p className="text-xs text-gray-600 italic">
                                    "{notification.originalMessage}"
                                  </p>
                                </div>

                                {notification.emotions.length > 0 && (
                                  <div className="mb-3">
                                    <h5 className="text-xs font-semibold text-gray-800 mb-1">🎭 Detected Emotions:</h5>
                                    <div className="flex flex-wrap gap-1">
                                      {notification.emotions.map((emotion, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                                        >
                                          {emotion}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="bg-blue-50 p-3 rounded-lg">
                                  <h5 className="text-xs font-semibold text-blue-800 mb-2">🤖 AI Recommendations:</h5>
                                  <ul className="text-xs text-blue-700 space-y-1">
                                    {notification.remedies.map((remedy, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        <span>{remedy}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 ml-3">
                              {!notification.isRead && (
                                <button
                                  onClick={() => stressNotifications.markAsRead(notification.id)}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                                >
                                  Mark read
                                </button>
                              )}
                              <button
                                onClick={() => stressNotifications.deleteNotification(notification.id)}
                                className="text-gray-400 hover:text-red-500 text-lg"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 text-center">
                    🤖 AI automatically analyzes your messages for stress patterns and provides personalized wellness recommendations
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}