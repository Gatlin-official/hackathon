'use client'

import { useState, useCallback } from 'react'
import { EmotionalResponse } from '@/lib/supportive-ai-companion'

export interface UseSupportiveCompanionOptions {
  autoGenerate?: boolean
  stressThreshold?: number
}

export function useSupportiveCompanion(options: UseSupportiveCompanionOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastResponse, setLastResponse] = useState<EmotionalResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateResponse = useCallback(async (
    message: string,
    stressScore?: number,
    emotions?: string[],
    context?: string
  ): Promise<EmotionalResponse | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/supportive-companion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          stressScore,
          emotions,
          context
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate supportive response')
      }

      const data = await response.json()
      const supportiveResponse = data.response as EmotionalResponse
      
      setLastResponse(supportiveResponse)
      return supportiveResponse

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error generating supportive response:', error)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [])

  // Auto-generate response if stress threshold is met
  const checkAndGenerate = useCallback(async (
    message: string,
    stressScore?: number,
    emotions?: string[]
  ) => {
    const threshold = options.stressThreshold || 5
    
    if (options.autoGenerate && stressScore && stressScore >= threshold) {
      return await generateResponse(message, stressScore, emotions, 'auto')
    }
    
    return null
  }, [generateResponse, options.autoGenerate, options.stressThreshold])

  // Format response for different display contexts
  const formatResponse = useCallback((
    response: EmotionalResponse | null,
    format: 'brief' | 'detailed' | 'notification' = 'detailed'
  ): string => {
    if (!response) return ''

    switch (format) {
      case 'brief':
        return response.message
        
      case 'notification':
        return `💙 ${response.message}`
        
      case 'detailed':
        let formatted = response.message
        if (response.suggestions.length > 0) {
          formatted += '\n\nGentle suggestions:\n'
          formatted += response.suggestions.map(s => `• ${s}`).join('\n')
        }
        return formatted
        
      default:
        return response.message
    }
  }, [])

  // Get supportive message based on stress level
  const getQuickSupport = useCallback((stressScore: number): string => {
    if (stressScore <= 3) {
      return "You're doing great! Keep up the positive energy. 🌟"
    } else if (stressScore <= 6) {
      return "I notice you might be feeling some pressure. Remember to take things one step at a time. 💙"
    } else {
      return "It sounds like you're going through a tough time. You're not alone, and it's okay to take a moment to breathe. 🤗"
    }
  }, [])

  return {
    // State
    isGenerating,
    lastResponse,
    error,
    
    // Actions
    generateResponse,
    checkAndGenerate,
    formatResponse,
    getQuickSupport,
    
    // Helpers
    clearError: () => setError(null),
    clearResponse: () => setLastResponse(null)
  }
}

// Pre-built supportive messages for common situations
export const QUICK_SUPPORT_MESSAGES = {
  examStress: "Exams can feel overwhelming, but you've prepared well. Take deep breaths and trust in your abilities. 📚💙",
  
  assignmentPressure: "Assignments piling up? Break them into smaller tasks and tackle one at a time. You've got this! 📝✨",
  
  socialAnxiety: "Social situations can be nerve-wracking. Remember, most people are understanding and you're braver than you think. 🤝💙",
  
  generalOverwhelm: "When everything feels like too much, it's okay to pause and breathe. You don't have to handle everything at once. 🌸",
  
  loneliness: "Feeling alone is hard, but you're part of a community here. Reach out when you need support - people care about you. 🤗",
  
  failure: "Setbacks are part of learning and growing. This doesn't define you - you're resilient and capable of bouncing back. 💪💙",
  
  uncertainty: "Not knowing what's next can be scary, but uncertainty also brings possibilities. Take it one day at a time. 🌅"
} as const