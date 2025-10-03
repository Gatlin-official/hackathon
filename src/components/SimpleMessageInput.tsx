'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface SimpleMessageInputProps {
  onSendMessage: (text: string, intention?: 'venting' | 'advice' | 'urgent' | null) => void
  groupId: string
}

export default function SimpleMessageInput({ onSendMessage, groupId }: SimpleMessageInputProps) {
  const { data: session } = useSession()
  const [message, setMessage] = useState('')
  const [intention, setIntention] = useState<'venting' | 'advice' | 'urgent' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // Send the message first, analyze later
    onSendMessage(message, intention)
    
    // Reset form
    setMessage('')
    setIntention(null)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4">
      {/* Intention Selector */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message Type (optional):
        </label>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: null, label: '💬 General', color: 'bg-gray-100 text-gray-800 border border-gray-300' },
            { value: 'venting' as const, label: '😤 Venting', color: 'bg-orange-100 text-orange-800 border border-orange-300' },
            { value: 'advice' as const, label: '🤔 Need Advice', color: 'bg-blue-100 text-blue-800 border border-blue-300' },
            { value: 'urgent' as const, label: '🚨 Urgent Help', color: 'bg-red-100 text-red-800 border border-red-300' }
          ].map(({ value, label, color }) => (
            <button
              key={label}
              type="button"
              onClick={() => setIntention(value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                intention === value 
                  ? color.replace('100', '200').replace('border-', 'border-2 border-')
                  : color
              } hover:${color.replace('100', '200')}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
            rows={3}
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-400">
              {message.length}/1000
            </span>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!message.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-lg transition duration-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Send
        </button>
      </div>
    </form>
  )
}