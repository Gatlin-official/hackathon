'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import io from 'socket.io-client'
import { getUsernameForEmail, getCurrentUsername } from '@/utils/username'
import { criticalKeywordDetector } from '@/lib/critical-keyword-detector'
import { backgroundStressAnalyzer } from '@/lib/background-stress-analyzer'
import { useStressNotifications } from '@/hooks/useStressNotifications'
import SmartMessageInput from './SmartMessageInput'

interface Message {
  id: string
  text: string
  senderId: string
  senderName: string
  senderEmail: string
  timestamp: Date
  intention?: 'venting' | 'advice' | 'urgent' | null
  stressScore?: number
  stressLevel?: 'low' | 'moderate' | 'high' | 'severe'
  emotions?: string[]
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
  const [showCrisisAlert, setShowCrisisAlert] = useState(false)
  const [crisisMessage, setCrisisMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<any>(null)
  
  // Stress notification system
  const stressNotifications = useStressNotifications(session?.user?.email || 'anonymous')

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

    // Setup background stress analyzer notification callback
    backgroundStressAnalyzer.setNotificationCallback((userId: string, notification: any) => {
      if (userId === session?.user?.email) {
        stressNotifications.addNotification(notification)
      }
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-group', groupId)
        socketRef.current.disconnect()
      }
    }
  }, [groupId])

  const handleSendMessage = async (text: string, intention?: 'venting' | 'advice' | 'urgent' | null) => {
    if (!text.trim() || !session?.user) return

    const currentUsername = getCurrentUsername(session)
    
    // Step 1: Check for critical keywords before sending
    const criticalCheck = criticalKeywordDetector.detectCriticalContent(text)
    
    if (criticalCheck.isCritical) {
      // Show immediate crisis alert
      setCrisisMessage(criticalKeywordDetector.generateCrisisAlert(criticalCheck.detectedKeywords))
      setShowCrisisAlert(true)
      return // Don't send the message, let user handle crisis first
    }

    // Step 2: Send message immediately (normal flow)
    const message: Message = {
      id: Date.now().toString(),
      text,
      senderId: session.user?.email || 'anonymous',
      senderName: currentUsername,
      senderEmail: session.user?.email || '',
      timestamp: new Date(),
      intention,
      sender: {
        name: currentUsername,
        email: session.user?.email || ''
      }
    }

    // Send to socket server immediately
    socketRef.current?.emit('send-message', { groupId, message })

    // Step 3: Queue message for background stress analysis
    backgroundStressAnalyzer.queueMessage({
      messageId: message.id,
      text: message.text,
      userId: message.senderId,
      userEmail: message.senderEmail,
      timestamp: message.timestamp,
      groupId: groupId,
      conversationContext: messages.slice(-3).map(m => m.text) // Last 3 messages for context
    })
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
          const senderName = message.sender?.name || message.senderName || getCurrentUsername(null)
          const isOwnMessage = senderEmail === session?.user?.email
          
          // Stress level colors for subtle indication (only visible to sender)
          const getStressBorder = (stressLevel?: string, stressScore?: number) => {
            if (!isOwnMessage || !stressScore) return ''
            if (stressScore >= 8) return 'border-l-4 border-red-400'
            if (stressScore >= 6) return 'border-l-4 border-yellow-400'
            if (stressScore >= 4) return 'border-l-4 border-blue-400'
            return 'border-l-4 border-green-400'
          }
          
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
                } ${getStressBorder(message.stressLevel, message.stressScore)}`}
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
                
                {/* Stress indicator (only visible to message sender) */}
                {isOwnMessage && message.stressScore && message.stressScore > 5 && (
                  <span className="ml-2 text-xs opacity-75">
                    {message.stressScore >= 8 ? '🔴' : message.stressScore >= 6 ? '🟡' : '🟢'}
                  </span>
                )}
              </div>
              
              <p className="text-sm">{message.text}</p>
              
              {/* Emotions detected (only visible to sender) */}
              {isOwnMessage && message.emotions && message.emotions.length > 0 && (
                <div className="mt-2 text-xs opacity-75">
                  {message.emotions.slice(0, 2).join(', ')}
                </div>
              )}
            </div>
          </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <SmartMessageInput onSendMessage={handleSendMessage} groupId={groupId} />

      {/* Crisis Alert Modal */}
      {showCrisisAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border-l-4 border-red-500">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-3">
                  🆘 Crisis Support Needed
                </h3>
                <div className="text-gray-700 text-sm whitespace-pre-line mb-4">
                  {crisisMessage}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCrisisAlert(false)
                      setCrisisMessage('')
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition"
                  >
                    I understand, get help
                  </button>
                  <button
                    onClick={() => {
                      setShowCrisisAlert(false)
                      setCrisisMessage('')
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}