'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import io from 'socket.io-client'

interface JoinGroupProps {
  onClose: () => void
  onGroupJoined?: () => void
}

export default function JoinGroup({ onClose, onGroupJoined }: JoinGroupProps) {
  const { data: session } = useSession()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    
    if (!session?.user?.email) {
      setError('Please log in first')
      return
    }

    setLoading(true)
    setError('')
    
    const socket = io('http://localhost:3003')
    
    socket.on('join-result', (result) => {
      if (result.success) {
        onGroupJoined?.()
        onClose()
      } else {
        setError(result.message || 'Invalid invite code')
      }
      setLoading(false)
      socket.disconnect()
    })
    
    socket.on('error', (errorMsg) => {
      setError(errorMsg || 'An error occurred')
      setLoading(false)
      socket.disconnect()
    })
    
    socket.emit('join-private-group', { 
      inviteCode: inviteCode.toUpperCase(),
      userEmail: session.user.email 
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Join Private Group
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                Invite Code
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter 6-character invite code"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg uppercase"
                maxLength={6}
                required
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!inviteCode.trim() || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                {loading ? 'Joining...' : 'Join Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}