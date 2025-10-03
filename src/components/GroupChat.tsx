'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import io from 'socket.io-client'
import { getUsernameForEmail } from '@/utils/username'
import SmartMessageInput from './SmartMessageInput'

interface Message {
  id: string
  text: string
  senderId: string
  senderName: string
  senderEmail: string
  timestamp: Date
  intention?: 'venting' | 'advice' | 'urgent' | null
  // Optional sender object for backwards compatibility
  sender?: {
    name: string
    email: string
  }
}

interface GroupChatProps {
  groupId: string
}

export default function GroupChat({ groupId }: GroupChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
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
    socketRef.current = io('http://localhost:3003')
    
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

  const handleSendMessage = (text: string, intention?: 'venting' | 'advice' | 'urgent' | null) => {
    if (!text.trim() || !session?.user) return

    const message: Message = {
      id: Date.now().toString(),
      text,
      senderId: session.user.email || '',
      senderName: getUsernameForEmail(session.user.email || ''),
      senderEmail: session.user.email || '',
      timestamp: new Date(),
      intention,
      sender: {
        name: getUsernameForEmail(session.user.email || ''),
        email: session.user.email || ''
      }
    }

    // Send to socket server
    socketRef.current?.emit('send-message', { groupId, message })
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
        {messages.map((message) => {
          // Handle different message data structures
          const senderEmail = message.sender?.email || message.senderEmail || ''
          const senderName = message.sender?.name || message.senderName || 'Unknown User'
          const isOwnMessage = senderEmail === session?.user?.email
          
          return (
            <div
              key={message.id}
              className={`flex ${
                isOwnMessage ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwnMessage
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
                <span className="font-medium">{senderName}</span>
                <span className="ml-2 text-xs opacity-75">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <SmartMessageInput onSendMessage={handleSendMessage} groupId={groupId} />
    </div>
  )
}