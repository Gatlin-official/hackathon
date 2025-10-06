'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import GroupList from '@/components/GroupList'
import GroupChat from '@/components/GroupChat'
import CreateGroup from '@/components/CreateGroup'
import InviteDetails from '@/components/InviteDetails'
import JoinGroup from '@/components/JoinGroup'
import PersonalDashboard from '@/components/PersonalDashboard'
import MoodTrackingDashboard from '@/components/MoodTrackingDashboard'
import WellnessHub from '@/components/WellnessHub'
import { EnhancedStressAnalysis } from '@/lib/enhanced-stress-analyzer'

export default function EnhancedHomePage() {
  const { data: session, status } = useSession()
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [showPersonalDashboard, setShowPersonalDashboard] = useState(false)
  const [showMoodDashboard, setShowMoodDashboard] = useState(false)
  const [showWellnessHub, setShowWellnessHub] = useState(false)
  const [activeView, setActiveView] = useState<'groups' | 'mood' | 'wellness' | 'personal'>('groups')
  const [groupListKey, setGroupListKey] = useState(0)
  const [inviteDetails, setInviteDetails] = useState<{
    groupName: string
    inviteCode: string
    inviteLink: string
  } | null>(null)
  
  // Enhanced state for mood tracking
  const [currentStressLevel, setCurrentStressLevel] = useState(3)
  const [currentMood, setCurrentMood] = useState('Calm')
  const [recentAnalysis, setRecentAnalysis] = useState<EnhancedStressAnalysis | null>(null)
  const [moodHistory, setMoodHistory] = useState<Array<{
    timestamp: Date;
    stressLevel: number;
    moodType: string;
  }>>([])

  // Load mood history on component mount
  useEffect(() => {
    if (session?.user?.email) {
      loadMoodHistory()
    }
  }, [session])

  const loadMoodHistory = () => {
    try {
      const historyKey = `stress_history_${session?.user?.email}`
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
      const moodData = history.map((h: any) => ({
        timestamp: new Date(h.timestamp),
        stressLevel: h.stressLevel,
        moodType: h.moodType
      }))
      setMoodHistory(moodData.slice(-30)) // Last 30 entries
      
      // Set current mood from most recent analysis
      if (moodData.length > 0) {
        const latest = moodData[moodData.length - 1]
        setCurrentStressLevel(latest.stressLevel)
        setCurrentMood(latest.moodType)
      }
    } catch (error) {
      console.error('Failed to load mood history:', error)
    }
  }

  // Handle new analysis from chat
  const handleNewAnalysis = (analysis: EnhancedStressAnalysis) => {
    setRecentAnalysis(analysis)
    setCurrentStressLevel(analysis.stressLevel)
    setCurrentMood(analysis.moodType)
    
    // Add to mood history
    const newMoodPoint = {
      timestamp: new Date(),
      stressLevel: analysis.stressLevel,
      moodType: analysis.moodType
    }
    setMoodHistory(prev => [...prev, newMoodPoint].slice(-30))
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wellness dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🧠</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Student Wellness Hub
            </h1>
            <p className="text-gray-600 mb-8">
              Connect, chat, and maintain your mental wellness with AI-powered emotional support
            </p>
            <button
              onClick={() => signIn('google')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
            
            <div className="mt-6 text-xs text-gray-500">
              <p>✓ AI-powered emotional intelligence</p>
              <p>✓ Real-time mood tracking</p>
              <p>✓ Crisis detection & support</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Navigation Header */}
      <nav className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">🧠</div>
              <h1 className="text-xl font-bold text-gray-900">Student Wellness Hub</h1>
            </div>
            
            {/* Enhanced Navigation */}
            <div className="flex items-center space-x-4">
              {/* View Switcher */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'groups', label: 'Groups', icon: '💬' },
                  { key: 'mood', label: 'Mood', icon: '📊' },
                  { key: 'wellness', label: 'Wellness', icon: '🌱' },
                  { key: 'personal', label: 'Personal', icon: '👤' }
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveView(key as any)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeView === key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-1">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              {/* Current Mood Indicator */}
              {currentStressLevel > 0 && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentStressLevel >= 7 ? 'bg-red-100 text-red-800' :
                  currentStressLevel >= 5 ? 'bg-yellow-100 text-yellow-800' :
                  currentStressLevel >= 3 ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {currentMood} ({currentStressLevel}/10)
                </div>
              )}

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <img
                  src={session.user?.image || ''}
                  alt={session.user?.name || ''}
                  className="w-8 h-8 rounded-full"
                />
                <button
                  onClick={() => signOut()}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Groups View */}
        {activeView === 'groups' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Discussion Groups</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600 transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setShowJoinGroup(true)}
                      className="bg-green-500 text-white px-3 py-2 rounded-md text-sm hover:bg-green-600 transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
                
                <div style={{ height: 'calc(100vh - 300px)' }}>
                  <div className="overflow-y-auto" style={{ minHeight: '0', height: '100%' }}>
                    <GroupList 
                      key={groupListKey}
                      selectedGroup={selectedGroup}
                      onSelectGroup={setSelectedGroup}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-2">
              {selectedGroup ? (
                <GroupChat 
                  groupId={selectedGroup}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Welcome to Your Wellness Hub
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Select a group to start chatting, or create a new group to connect with others.
                    Our AI will help monitor emotional well-being and provide support when needed.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Create Group
                    </button>
                    <button
                      onClick={() => setActiveView('mood')}
                      className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      View Mood Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mood Dashboard View */}
        {activeView === 'mood' && (
          <MoodTrackingDashboard 
            moodHistory={moodHistory}
            className="mb-8"
          />
        )}

        {/* Wellness Hub View */}
        {activeView === 'wellness' && (
          <WellnessHub
            currentStressLevel={currentStressLevel}
            currentMood={currentMood}
            recentAnalysis={recentAnalysis || undefined}
          />
        )}

        {/* Personal Dashboard View */}
        {activeView === 'personal' && (
          <PersonalDashboard onClose={() => setActiveView('groups')} />
        )}
      </div>

      {/* Modals */}
      {showCreateGroup && (
        <CreateGroup
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={(details) => {
            setInviteDetails(details)
            setShowCreateGroup(false)
            setGroupListKey(prev => prev + 1)
          }}
        />
      )}

      {showJoinGroup && (
        <JoinGroup
          onClose={() => setShowJoinGroup(false)}
          onGroupJoined={() => {
            setShowJoinGroup(false)
            setGroupListKey(prev => prev + 1)
          }}
        />
      )}

      {inviteDetails && (
        <InviteDetails
          {...inviteDetails}
          onClose={() => setInviteDetails(null)}
        />
      )}
    </div>
  )
}