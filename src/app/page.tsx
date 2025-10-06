'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import GroupList from '@/components/GroupList'
import GroupChat from '@/components/GroupChat'
import CreateGroup from '@/components/CreateGroup'
import InviteDetails from '@/components/InviteDetails'
import JoinGroup from '@/components/JoinGroup'
import PersonalDashboard from '@/components/PersonalDashboard'
import AccountSettings from '@/components/AccountSettings'
import HelpSupport from '@/components/HelpSupport'
import { clearAuthState, checkFreshSession } from '@/utils/auth'

export default function HomePage() {
  const { data: session, status } = useSession()
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [showPersonalDashboard, setShowPersonalDashboard] = useState(false)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showHelpSupport, setShowHelpSupport] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [groupListKey, setGroupListKey] = useState(0) // Key to force GroupList refresh
  const [inviteDetails, setInviteDetails] = useState<{
    groupName: string
    inviteCode: string
    inviteLink: string
  } | null>(null)

  // Check for fresh session on component mount
  useEffect(() => {
    checkFreshSession()
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && !(event.target as Element).closest('.menu-container')) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Student Discussion Groups
            </h1>
            <p className="text-gray-600 mb-8">
              Connect with fellow students and join meaningful discussions
            </p>
            <button
              onClick={() => signIn('google')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Discussion Groups
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {session.user?.name}
              </span>
              <div className="relative menu-container">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowPersonalDashboard(true)
                          setShowMenu(false)
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">My Dashboard</p>
                          <p className="text-xs text-gray-500">View your analytics</p>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowAccountSettings(true)
                          setShowMenu(false)
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Account Settings</p>
                          <p className="text-xs text-gray-500">Preferences & configuration</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setShowHelpSupport(true)
                          setShowMenu(false)
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Help & Support</p>
                          <p className="text-xs text-gray-500">Get assistance & FAQ</p>
                        </div>
                      </button>
                      
                      <div className="border-t border-gray-100 my-2"></div>
                      
                      <button
                        onClick={async () => {
                          setShowMenu(false)
                          await clearAuthState()
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-red-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-red-900">Sign Out</p>
                          <p className="text-xs text-red-500">End your session</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Groups
                </h2>
                <div className="space-x-2">
                  <button
                    onClick={() => setShowJoinGroup(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm transition duration-200"
                  >
                    Join Private
                  </button>
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm transition duration-200"
                  >
                    + New Group
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2" style={{ minHeight: '0' }}>
                <GroupList 
                  key={groupListKey}
                  onSelectGroup={setSelectedGroup}
                  selectedGroup={selectedGroup}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedGroup ? (
              <GroupChat groupId={selectedGroup} />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center h-96">
                <div className="text-center text-gray-500">
                  <h3 className="text-lg font-medium mb-2">
                    Select a group to start chatting
                  </h3>
                  <p>Choose a group from the sidebar to join the conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateGroup && (
        <CreateGroup 
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={(details) => {
            setInviteDetails(details)
            setGroupListKey(prev => prev + 1) // Refresh GroupList
          }}
        />
      )}

      {showJoinGroup && (
        <JoinGroup 
          onClose={() => setShowJoinGroup(false)}
          onGroupJoined={() => {
            setGroupListKey(prev => prev + 1) // Refresh GroupList
            setShowJoinGroup(false)
          }}
        />
      )}

      {inviteDetails && (
        <InviteDetails
          groupName={inviteDetails.groupName}
          inviteCode={inviteDetails.inviteCode}
          inviteLink={inviteDetails.inviteLink}
          onClose={() => setInviteDetails(null)}
        />
      )}

      {showPersonalDashboard && (
        <PersonalDashboard 
          onClose={() => setShowPersonalDashboard(false)}
        />
      )}

      {showAccountSettings && (
        <AccountSettings 
          onClose={() => setShowAccountSettings(false)}
        />
      )}

      {showHelpSupport && (
        <HelpSupport 
          onClose={() => setShowHelpSupport(false)}
        />
      )}

    </div>
  )
}