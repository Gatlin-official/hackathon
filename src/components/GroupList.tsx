'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import io from 'socket.io-client'

interface Group {
  id: string
  name: string
  description: string
  memberCount: number
  type: 'public' | 'private'
  inviteCode?: string
  inviteLink?: string
}

interface GroupListProps {
  onSelectGroup: (groupId: string) => void
  selectedGroup: string | null
}

export default function GroupList({ onSelectGroup, selectedGroup }: GroupListProps) {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch groups from API
    const fetchGroups = async () => {
      try {
        const params = new URLSearchParams()
        if (session?.user?.email) {
          params.append('userEmail', session.user.email)
        }
        
        const response = await fetch(`http://localhost:3003/api/groups?${params}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const fetchedGroups = await response.json()
        console.log('Fetched groups:', fetchedGroups)
        
        // Ensure fetchedGroups is an array
        if (Array.isArray(fetchedGroups)) {
          setGroups(fetchedGroups)
        } else {
          console.error('Expected array but got:', typeof fetchedGroups, fetchedGroups)
          setGroups([]) // Set empty array as fallback
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching groups:', error)
        setGroups([]) // Set empty array as fallback
        setLoading(false)
      }
    }

    fetchGroups()

    // Set up socket connection for real-time group updates
    const socket = io('http://localhost:3003')
    
    socket.on('group-created', (newGroup) => {
      // For public groups, add immediately to the list
      if (newGroup.type === 'public') {
        setGroups(prev => [...prev, newGroup])
      } else {
        // For private groups, refetch the entire list to ensure proper visibility
        fetchGroups()
      }
    })

    socket.on('group-joined', () => {
      // Refetch groups when user joins a group
      fetchGroups()
    })

    return () => {
      socket.disconnect()
    }
  }, [session?.user?.email]) // Refetch when user session changes

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {groups.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p className="mb-2">No groups yet</p>
          <p className="text-sm">Create your first discussion group to get started!</p>
        </div>
      ) : (
        Array.isArray(groups) && groups.map((group) => (
          <button
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            className={`w-full text-left p-3 rounded-lg transition duration-200 ${
              selectedGroup === group.id
                ? 'bg-blue-50 border-2 border-blue-200'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    group.type === 'public' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {group.type === 'public' ? '🌍 Public' : '🔒 Private'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                <p className="text-xs text-gray-500">{group.memberCount} members</p>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full ml-2"></div>
            </div>
          </button>
        ))
      )}
    </div>
  )
}