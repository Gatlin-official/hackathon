'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import io from 'socket.io-client'
import { getUsernameForEmail } from '@/utils/username'

interface Message {
  id: string
  text: string
  sender: {
    name: string
    email: string
  }
  timestamp: Date
  intention?: 'venting' | 'advice' | 'urgent' | null
}

interface GroupChatProps {
  groupId: string
}

export default function GroupChat({ groupId }: GroupChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedIntention, setSelectedIntention] = useState<'venting' | 'advice' | 'urgent' | null>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:3002')
    
    // Join the group
    socketRef.current.emit('join-group', groupId)
    
    // Listen for existing messages
    socketRef.current.on('load-messages', (loadedMessages: Message[]) => {
      setMessages(loadedMessages)
      setLoading(false)
    })
    
    // Listen for new messages
    socketRef.current.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-group', groupId)
        socketRef.current.disconnect()
      }
    }
  }, [groupId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !session?.user) return

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: {
        name: getUsernameForEmail(session.user.email || ''),
        email: session.user.email || ''
      },
      timestamp: new Date(),
      intention: selectedIntention
    }

    // Send to socket server
    socketRef.current?.emit('send-message', { groupId, message })
    setNewMessage('')
    setSelectedIntention(null)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm flex flex-col h-96">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Group Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender.email === session?.user?.email
                ? 'justify-end'
                : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender.email === session?.user?.email
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {/* Intention Flag */}
              {message.intention && (
                <div className={`mb-2 text-xs px-2 py-1 rounded-full inline-block ${
                  message.intention === 'urgent' 
                    ? 'bg-red-500 text-white' 
                    : message.intention === 'advice'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-purple-500 text-white'
                }`}>
                  {message.intention === 'urgent' ? '🚨 Help Needed Fast' : 
                   message.intention === 'advice' ? '💡 Need Advice' : 
                   '💭 Just Venting'}
                </div>
              )}
              <div className="text-sm mb-1">
                <span className="font-medium">{message.sender.name}</span>
                <span className="ml-2 text-xs opacity-75">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        {/* Intention Buttons */}
        <div className="flex space-x-2 mb-3">
          <span className="text-sm text-gray-600 py-2">Intention:</span>
          <button
            type="button"
            onClick={() => setSelectedIntention(selectedIntention === 'venting' ? null : 'venting')}
            className={`px-3 py-1 rounded-full text-xs transition duration-200 ${
              selectedIntention === 'venting'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            💭 Just Venting
          </button>
          <button
            type="button"
            onClick={() => setSelectedIntention(selectedIntention === 'advice' ? null : 'advice')}
            className={`px-3 py-1 rounded-full text-xs transition duration-200 ${
              selectedIntention === 'advice'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            💡 Need Advice
          </button>
          <button
            type="button"
            onClick={() => setSelectedIntention(selectedIntention === 'urgent' ? null : 'urgent')}
            className={`px-3 py-1 rounded-full text-xs transition duration-200 ${
              selectedIntention === 'urgent'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🚨 Help Needed Fast
          </button>
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition duration-200"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}