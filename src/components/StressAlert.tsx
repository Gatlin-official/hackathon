'use client'

import { useState, useEffect } from 'react'
import { StressAnalysis } from '@/lib/stress-analyzer'

interface StressAlertProps {
  stressAnalysis: StressAnalysis | null
  onClose: () => void
  onAcceptSuggestion: (suggestion: string) => void
}

export default function StressAlert({ stressAnalysis, onClose, onAcceptSuggestion }: StressAlertProps) {
  if (!stressAnalysis || stressAnalysis.riskLevel === 'low') {
    return null
  }

  const getAlertColor = () => {
    switch (stressAnalysis.riskLevel) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800'
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-800'
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800'
      default: return 'bg-blue-100 border-blue-500 text-blue-800'
    }
  }

  const getIcon = () => {
    switch (stressAnalysis.riskLevel) {
      case 'critical':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'high':
        return (
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
        )
    }
  }

  const getTitle = () => {
    switch (stressAnalysis.riskLevel) {
      case 'critical': return '🚨 High Stress Detected'
      case 'high': return '⚠️ Stress Alert'
      case 'medium': return '💛 Stress Notice'
      default: return 'ℹ️ Wellness Check'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-md w-full rounded-lg border-l-4 p-6 shadow-lg bg-white ${getAlertColor()}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium mb-2">
              {getTitle()}
            </h3>
            
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium">Stress Level:</span>
                <div className="ml-2 flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      stressAnalysis.stressLevel >= 8 ? 'bg-red-500' :
                      stressAnalysis.stressLevel >= 6 ? 'bg-orange-500' :
                      stressAnalysis.stressLevel >= 4 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(stressAnalysis.stressLevel / 10) * 100}%` }}
                  />
                </div>
                <span className="ml-2 text-sm font-bold">{stressAnalysis.stressLevel}/10</span>
              </div>
            </div>

            {stressAnalysis.emotions.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Detected emotions:</p>
                <div className="flex flex-wrap gap-1">
                  {stressAnalysis.emotions.map((emotion, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {stressAnalysis.suggestions.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">💡 Suggestions to help:</p>
                <div className="space-y-2">
                  {stressAnalysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between bg-white bg-opacity-50 rounded p-2">
                      <span className="text-sm">{suggestion}</span>
                      <button
                        onClick={() => onAcceptSuggestion(suggestion)}
                        className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                      >
                        Try This
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stressAnalysis.riskLevel === 'critical' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800">
                  <strong>🆘 Crisis Support:</strong> If you're in immediate distress, please reach out:
                </p>
                <div className="mt-2 text-xs text-red-700">
                  • Campus Counseling: Call your student support services
                  • Crisis Hotline: 988 (US) or your local emergency number
                  • Trusted friend, family member, or counselor
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded transition"
              >
                Dismiss
              </button>
              {stressAnalysis.riskLevel !== 'critical' && (
                <button
                  onClick={onClose}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
                >
                  I'm OK
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}