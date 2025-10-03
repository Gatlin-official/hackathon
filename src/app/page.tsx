'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import GroupList from '@/components/GroupList'
import GroupChat from '@/components/GroupChat'
import CreateGroup from '@/components/CreateGroup'
import InviteDetails from '@/components/InviteDetails'
import JoinGroup from '@/components/JoinGroup'
import PersonalDashboard from '@/components/PersonalDashboard'

export default function HomePage() {
  const { data: session, status } = useSession()
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [showPersonalDashboard, setShowPersonalDashboard] = useState(false)
  const [groupListKey, setGroupListKey] = useState(0) // Key to force GroupList refresh
  const [inviteDetails, setInviteDetails] = useState<{
    groupName: string
    inviteCode: string
    inviteLink: string
  } | null>(null)

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
              <button
                onClick={() => setShowPersonalDashboard(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm transition duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                My Dashboard
              </button>
              <button
                onClick={() => signOut()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
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
              <GroupList 
                key={groupListKey}
                onSelectGroup={setSelectedGroup}
                selectedGroup={selectedGroup}
              />
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
    </div>
  )
}