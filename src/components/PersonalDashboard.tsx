'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getCurrentUsername } from '@/utils/username'
import { useStressNotifications, requestNotificationPermission } from '@/hooks/useStressNotifications'
import StressNotificationsPanel from './StressNotificationsPanel'

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

  // AI Chat functionality - Stress Level Analysis
  const analyzeStressLevel = (text: string): number => {
    const stressKeywords = {
      high: ['stressed', 'anxious', 'overwhelmed', 'panic', 'exhausted', 'burnout', 'pressure', 'deadline', 'worried', 'depressed', 'crying', 'help'],
      medium: ['tired', 'busy', 'concerned', 'frustrated', 'confused', 'uncertain', 'difficult', 'annoyed', 'upset'],
      low: ['calm', 'good', 'fine', 'okay', 'relaxed', 'peaceful', 'content', 'happy', 'great', 'awesome']
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

  // Handle sending messages
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return
    
    const stressLevel = analyzeStressLevel(inputMessage)
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
      stressLevel
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)
    
    // Update stats
    setStats(prev => ({
      ...prev,
      stressLevel,
      totalMessages: prev.totalMessages + 1
    }))
    
    // AI response with delay
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: generateAIAdvice(stressLevel),
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
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
              {/* Chat Header with Stress Analysis */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold mb-2">AI Wellness Assistant</h3>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Current Stress Level:</span>
                    <span className={`font-bold ${
                      stats.stressLevel <= 3 ? 'text-green-600' : 
                      stats.stressLevel <= 6 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {stats.stressLevel}/10
                    </span>
                    <span className="text-lg">
                      {stats.stressLevel <= 3 ? '😌' : stats.stressLevel <= 6 ? '😐' : '😰'}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    Messages: {stats.totalMessages}
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-3">🤖</div>
                    <p>Hi! I'm here to help with stress management.</p>
                    <p className="text-sm mt-2">Share how you're feeling and I'll provide personalized advice.</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className={`flex w-full ${message.isUser ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-xs px-4 py-3 rounded-2xl ${
                      message.isUser 
                        ? 'bg-blue-500 text-white rounded-bl-md' 
                        : 'bg-gray-100 text-gray-800 rounded-br-md'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                      {message.stressLevel && (
                        <div className="mt-1 text-xs opacity-80">
                          Stress: {message.stressLevel}/10
                          <span className="ml-1">
                            {message.stressLevel <= 3 ? '😌' : message.stressLevel <= 6 ? '😐' : '😰'}
                          </span>
                        </div>
                      )}
                      <div className="text-xs opacity-70 mt-1">
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

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="How are you feeling today? Share your thoughts..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
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
              <StressNotificationsPanel
                notifications={stressNotifications.notifications}
                onMarkAsRead={stressNotifications.markAsRead}
                onMarkAllAsRead={stressNotifications.markAllAsRead}
                onDelete={stressNotifications.deleteNotification}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}