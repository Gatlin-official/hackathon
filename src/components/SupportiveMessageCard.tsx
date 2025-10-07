'use client'

import { useState } from 'react'
import { EmotionalResponse } from '@/lib/supportive-ai-companion'
import { useSupportiveCompanion } from '@/hooks/useSupportiveCompanion'

interface SupportiveMessageCardProps {
  message?: string
  stressScore?: number
  emotions?: string[]
  context?: 'chat' | 'notification' | 'dashboard'
  autoGenerate?: boolean
  onResponseGenerated?: (response: EmotionalResponse) => void
  className?: string
}

export default function SupportiveMessageCard({
  message = '',
  stressScore = 0,
  emotions = [],
  context = 'chat',
  autoGenerate = false,
  onResponseGenerated,
  className = ''
}: SupportiveMessageCardProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [hasInteracted, setHasInteracted] = useState(false)
  
  const {
    generateResponse,
    isGenerating,
    lastResponse,
    error,
    formatResponse,
    getQuickSupport
  } = useSupportiveCompanion({ autoGenerate, stressThreshold: 4 })

  // Generate response on mount if conditions are met
  useState(() => {
    if (autoGenerate && stressScore >= 4 && message && !hasInteracted) {
      generateResponse(message, stressScore, emotions, context).then(response => {
        if (response && onResponseGenerated) {
          onResponseGenerated(response)
        }
      })
    }
  })

  const handleGenerateSupport = async () => {
    setHasInteracted(true)
    const response = await generateResponse(message, stressScore, emotions, context)
    if (response && onResponseGenerated) {
      onResponseGenerated(response)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setHasInteracted(true)
  }

  const getCardStyle = () => {
    if (stressScore >= 7) return 'bg-red-50 border-red-200 border-l-red-500'
    if (stressScore >= 4) return 'bg-orange-50 border-orange-200 border-l-orange-500'
    return 'bg-blue-50 border-blue-200 border-l-blue-500'
  }

  const getIcon = () => {
    if (stressScore >= 7) return '🤗'
    if (stressScore >= 4) return '💙'
    return '🌟'
  }

  if (!isVisible || stressScore < 3) return null

  return (
    <div className={`border-l-4 rounded-r-lg p-4 mb-3 ${getCardStyle()} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getIcon()}</span>
          <span className="font-medium text-gray-800 text-sm">
            Your AI Wellness Companion
          </span>
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 text-sm"
          aria-label="Dismiss message"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Loading State */}
        {isGenerating && (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm italic">Preparing a supportive message...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">
              Sorry, I couldn't generate a personalized message right now. 
              {stressScore >= 4 && (
                <span className="block mt-1 font-medium">
                  {getQuickSupport(stressScore)}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Generated Response */}
        {lastResponse && (
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-gray-800 mb-2 leading-relaxed">
              {lastResponse.message}
            </p>
            
            {lastResponse.suggestions.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Gentle suggestions:
                </p>
                <div className="space-y-1">
                  {lastResponse.suggestions.slice(0, 3).map((suggestion, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-500 mt-0.5">✨</span>
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Interaction Buttons */}
            <div className="flex gap-2 mt-3 pt-2 border-t">
              <button
                onClick={() => setHasInteracted(true)}
                className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
              >
                This helped 💚
              </button>
              <button
                onClick={handleGenerateSupport}
                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                Get more support
              </button>
            </div>
          </div>
        )}

        {/* Generate Button (if no response yet) */}
        {!lastResponse && !isGenerating && !error && stressScore >= 4 && (
          <div className="text-center">
            <button
              onClick={handleGenerateSupport}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              Get personalized support 💙
            </button>
          </div>
        )}

        {/* Quick Support (for lower stress levels) */}
        {!lastResponse && !isGenerating && stressScore >= 3 && stressScore < 4 && (
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-gray-700 text-sm">
              {getQuickSupport(stressScore)}
            </p>
          </div>
        )}
      </div>

      {/* Context info (debug - remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 pt-2 border-t text-xs text-gray-500">
          Stress: {stressScore}/10 • Tone: {lastResponse?.tone} • 
          Context: {context} • Emotions: {emotions.join(', ') || 'none'}
        </div>
      )}
    </div>
  )
}