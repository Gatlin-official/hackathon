'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// Client-side types (matching server-side)
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  description: string;
  type: 'study' | 'break' | 'wellness' | 'exam' | 'assignment';
  location?: string;
}

interface CalendarIntegrationProps {
  calendarSuggestion: {
    needed: boolean
    type: string
    subject?: string
    examDate?: string
    stressLevel: number
  }
  onCalendarCreated?: (success: boolean, eventCount: number) => void
  className?: string
}

export default function CalendarIntegration({ 
  calendarSuggestion, 
  onCalendarCreated,
  className = '' 
}: CalendarIntegrationProps) {
  const { data: session } = useSession()
  const [isCreating, setIsCreating] = useState(false)
  const [hasCalendarAccess, setHasCalendarAccess] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [plannedEvents, setPlannedEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    checkCalendarAccess()
  }, [session])

  const checkCalendarAccess = async () => {
    // For now, we'll simulate calendar access based on session
    // In a full implementation, you'd get the actual Google access token via NextAuth
    if (session?.user) {
      setHasCalendarAccess(true) // Simulate access for demo
    }
  }

  const generatePreview = async () => {
    if (!calendarSuggestion.needed) return

    try {
      let action = ''
      let params: any = { stressLevel: calendarSuggestion.stressLevel }

      if (calendarSuggestion.type === 'study_plan' || calendarSuggestion.type === 'exam_prep') {
        action = 'generate_study_plan'
        params.subject = calendarSuggestion.subject || 'Your Subject'
        params.examDate = calendarSuggestion.examDate || 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      } else if (calendarSuggestion.type === 'wellness_schedule') {
        action = 'generate_wellness_plan'
        params.days = 7
      } else if (calendarSuggestion.type === 'time_management') {
        action = 'generate_time_management'
        params.subject = calendarSuggestion.subject || 'Studies'
      }

      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params })
      })

      const data = await response.json()
      
      if (data.success) {
        // Convert date strings back to Date objects
        const events = data.events.map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }))
        
        setPlannedEvents(events.slice(0, 8)) // Show first 8 events
        setShowPreview(true)
      } else {
        console.error('Failed to generate calendar events:', data.error)
      }
    } catch (error) {
      console.error('Error generating calendar preview:', error)
    }
  }

  const createCalendarEvents = async () => {
    if (!hasCalendarAccess || plannedEvents.length === 0) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create_events',
          events: plannedEvents 
        })
      })

      const result = await response.json()
      
      if (onCalendarCreated) {
        onCalendarCreated(result.success, result.createdEvents || plannedEvents.length)
      }

      if (result.success) {
        setShowPreview(false)
      }
    } catch (error) {
      console.error('Failed to create calendar events:', error)
      if (onCalendarCreated) {
        onCalendarCreated(false, 0)
      }
    } finally {
      setIsCreating(false)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'study': return '📚'
      case 'wellness': return '🧘'
      case 'break': return '☀️'
      case 'exam': return '🎯'
      default: return '📅'
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'study': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'wellness': return 'bg-green-50 border-green-200 text-green-800'
      case 'break': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'exam': return 'bg-red-50 border-red-200 text-red-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const formatEventTime = (date: Date) => {
    return date.toLocaleString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (!calendarSuggestion.needed) {
    return null
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            📅 Smart Calendar Assistant
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              AI-Powered
            </span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            I can create a personalized schedule to help manage your stress and studies!
          </p>
        </div>
      </div>

      {!hasCalendarAccess ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
          <p className="text-sm text-yellow-800">
            📝 <strong>Calendar Access Required:</strong> To create your schedule, please make sure you're signed in with Google and have granted calendar permissions.
          </p>
        </div>
      ) : !showPreview ? (
        <div className="space-y-3">
          <div className="bg-white rounded border p-3">
            <h4 className="font-medium text-gray-900 mb-2">📋 What I'll Create:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              {calendarSuggestion.type === 'study_plan' && (
                <>
                  <div>• Structured study sessions for {calendarSuggestion.subject || 'your subject'}</div>
                  <div>• Strategic breaks based on your stress level ({calendarSuggestion.stressLevel}/10)</div>
                  <div>• Exam preparation timeline</div>
                </>
              )}
              {calendarSuggestion.type === 'wellness_schedule' && (
                <>
                  <div>• Daily wellness breaks and stress relief sessions</div>
                  <div>• Mindfulness reminders tailored to stress level ({calendarSuggestion.stressLevel}/10)</div>
                  <div>• Evening wind-down routines</div>
                </>
              )}
              {calendarSuggestion.type === 'exam_prep' && (
                <>
                  <div>• Exam countdown schedule for {calendarSuggestion.subject || 'your subject'}</div>
                  <div>• Review sessions with built-in stress management</div>
                  <div>• Final day preparation and confidence building</div>
                </>
              )}
              {calendarSuggestion.type === 'time_management' && (
                <>
                  <div>• Balanced study and wellness schedule</div>
                  <div>• Time blocking for better productivity</div>
                  <div>• Stress-adapted break intervals</div>
                </>
              )}
            </div>
          </div>

          <button
            onClick={generatePreview}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <span>🔮 Preview My Schedule</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded border p-3 max-h-64 overflow-y-auto">
            <h4 className="font-medium text-gray-900 mb-3 sticky top-0 bg-white">
              📋 Your Personalized Schedule ({plannedEvents.length} events)
            </h4>
            <div className="space-y-2">
              {plannedEvents.map((event, index) => (
                <div key={index} className={`p-2 rounded border text-xs ${getEventColor(event.type)}`}>
                  <div className="font-medium flex items-center gap-2">
                    {getEventIcon(event.type)} {event.title}
                  </div>
                  <div className="text-xs opacity-80 mt-1">
                    {formatEventTime(event.start)} - {formatEventTime(event.end)}
                  </div>
                  <div className="text-xs mt-1">{event.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
            >
              ← Back
            </button>
            <button
              onClick={createCalendarEvents}
              disabled={isCreating || !hasCalendarAccess}
              className="flex-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  📅 Add to Google Calendar
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}